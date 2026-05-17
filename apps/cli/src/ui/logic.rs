use ratatui::style::Style;
use tui_textarea::TextArea;
use routecode_sdk::agents::StreamChunk;
use routecode_sdk::core::{DynamicModelInfo, Message};
use crate::ui::{App, PROVIDERS, ModelMenuItem, Screen, COLOR_SECONDARY};

pub async fn handle_model_search(app: &mut App, search: &str, force_reset: bool) {
    let mut sections: Vec<ModelMenuItem> = Vec::new();
    let config = app.orchestrator.config.lock().await.clone();

    let recent: Vec<DynamicModelInfo> = config.recent_models.iter()
        .filter(|m| m.name.to_lowercase().contains(search) || m.provider_id.to_lowercase().contains(search))
        .cloned()
        .collect();
    if !recent.is_empty() {
        sections.push(ModelMenuItem::Header("Recently Used".to_string()));
        for m in recent { sections.push(ModelMenuItem::Model(m)); }
    }

    let favorites: Vec<DynamicModelInfo> = config.favorites.iter()
        .filter(|m| m.name.to_lowercase().contains(search) || m.provider_id.to_lowercase().contains(search))
        .cloned()
        .collect();
    if !favorites.is_empty() {
        sections.push(ModelMenuItem::Header("Favorite Models".to_string()));
        for m in favorites { sections.push(ModelMenuItem::Model(m)); }
    }

    let mut by_provider: std::collections::HashMap<String, Vec<DynamicModelInfo>> = std::collections::HashMap::new();
    for m in &app.all_available_models {
        if m.name.to_lowercase().contains(search) || m.provider_id.to_lowercase().contains(search) {
            by_provider.entry(m.provider_id.clone()).or_default().push(m.clone());
        }
    }

    let mut provider_ids: Vec<String> = by_provider.keys().cloned().collect();
    provider_ids.sort();

    for p_id in provider_ids {
        if let Some(models) = by_provider.get(&p_id) {
            let p_name = PROVIDERS.iter().find(|p| p.id == p_id).map(|p| p.name).unwrap_or(&p_id);
            sections.push(ModelMenuItem::Header(p_name.to_string()));
            for m in models { sections.push(ModelMenuItem::Model(m.clone())); }
        }
    }

    app.filtered_models = sections;
    
    if force_reset {
        if !app.filtered_models.is_empty() {
            let mut first_model = None;
            for (i, item) in app.filtered_models.iter().enumerate() {
                if let ModelMenuItem::Model(_) = item { first_model = Some(i); break; }
            }
            app.menu_state.select(first_model);
        } else { app.menu_state.select(None); }
    }
}

pub async fn handle_command(app: &mut App, input: &str) {
    let parts: Vec<&str> = input.split_whitespace().collect();
    if parts.is_empty() { return; }
    let command = parts[0];
    let args = &parts[1..];

    match command {
        "/model" => {
            app.show_model_menu = true;
            app.is_fetching_models = true;
            app.all_available_models.clear();
            app.model_search_input = TextArea::default();
            app.model_search_input.set_cursor_line_style(Style::default());
            app.model_search_input.set_placeholder_text(" Search models...");
            app.model_search_input.set_placeholder_style(Style::default().fg(COLOR_SECONDARY));
            handle_model_search(app, "", true).await;
            let config_mutex = app.orchestrator.config.clone();
            let tx = app.tx.clone();
            tokio::spawn(async move {
                let config = config_mutex.lock().await.clone();
                let mut set = tokio::task::JoinSet::new();
                for p_info in PROVIDERS {
                    let env_key = format!("{}_API_KEY", p_info.id.to_uppercase().replace("-", "_"));
                    let mut api_key = std::env::var(env_key).ok().or_else(|| config.api_keys.get(p_info.id).cloned());
                    if api_key.is_none() && p_info.id.starts_with("cloudflare") { api_key = std::env::var("CLOUDFLARE_API_KEY").ok(); }
                    if let Some(key) = api_key {
                        let provider_id = p_info.id.to_string();
                        let provider = routecode_sdk::agents::resolve_provider(&provider_id, key);
                        set.spawn(async move {
                            match provider.list_models().await {
                                Ok(models) => {
                                    let dynamic_models: Vec<DynamicModelInfo> = models.into_iter()
                                        .map(|m| DynamicModelInfo { name: m, provider_id: provider_id.clone() })
                                        .collect();
                                    Ok(dynamic_models)
                                }
                                Err(e) => Err(e),
                            }
                        });
                    }
                }
                while let Some(res) = set.join_next().await { if let Ok(Ok(models)) = res { let _ = tx.send(StreamChunk::Models { models }); } }
                let _ = tx.send(StreamChunk::ModelsDone);
            });
        }
        "/resume" => {
            if let Some(name) = args.first() {
                if let Ok(session) = routecode_sdk::utils::storage::load_session(name) {
                    app.history = session.messages;
                    app.current_model = session.model;
                    let mut u = app.orchestrator.usage.lock().await;
                    *u = session.usage;
                    app.session_id = name.to_string();
                    if let Ok(config) = routecode_sdk::utils::storage::load_session_config(name) {
                        app.orchestrator.allow_session_commands.store(config.allow_all_commands, std::sync::atomic::Ordering::SeqCst);
                        app.orchestrator.allow_session_outside_access.store(config.allow_all_outside_access, std::sync::atomic::Ordering::SeqCst);
                    }
                    if let Ok(workspace_config) = routecode_sdk::utils::storage::load_workspace_config() {
                        if workspace_config.allow_all_outside_access {
                            app.orchestrator.allow_session_outside_access.store(true, std::sync::atomic::Ordering::SeqCst);
                        }
                    }
                    app.history.push(Message::system(format!("Session resumed: {}", name)));
                    app.screen = Screen::Session;
                }
            }
        }
        "/sessions" => {
            if let Ok(sessions) = routecode_sdk::utils::storage::list_sessions() {
                if sessions.is_empty() { app.history.push(Message::system("No saved sessions found.")); }
                else { app.history.push(Message::system(format!("Saved sessions:\n  {}", sessions.join("\n  ")))); }
            }
        }
        "/clear" => {
            app.pending_clear = true;
        }
        "/stop" => {
            if app.is_generating {
                if let Some(handle) = app.current_task.take() { handle.abort(); }
                app.is_generating = false;
                app.active_tool = None;
                app.history.push(Message::system("Generation cancelled."));
            }
        }
        "/help" => {
            app.history.push(Message::system("Available commands:\n  /model           - Select model\n  /thinking <lvl>  - Set level (low/max)\n  /provider        - Manage connections\n  /settings        - Manage settings\n  /resume <name>   - Resume session\n  /sessions        - List sessions\n  /clear           - Clear history\n  /help            - Show help\n  /exit            - Use Esc to exit"));
        }
        "/thinking" => {
            if let Some(level) = args.first() {
                let level = level.to_lowercase();
                let valid = ["default", "low", "medium", "high", "max"];
                if valid.contains(&level.as_str()) {
                    let mut config = app.orchestrator.config.lock().await;
                    config.thinking_level = level.clone();
                    let _ = routecode_sdk::utils::storage::save_config(&config);
                    app.history.push(Message::system(format!("Thinking level set to: {}", level)));
                } else { app.history.push(Message::system(format!("Invalid level. Valid: {}", valid.join(", ")))); }
            } else {
                let config = app.orchestrator.config.lock().await;
                app.history.push(Message::system(format!("Current thinking level: {}", config.thinking_level)));
            }
        }
        "/provider" => { app.show_provider_menu = true; app.menu_state.select(Some(0)); }
        "/settings" => { app.populate_settings().await; app.show_settings_menu = true; app.menu_state.select(Some(1)); }
        "/exit" => {
            app.pending_exit = true;
        }
        _ => { app.history.push(Message::system(format!("Unknown command: {}", command))); }
    }
}

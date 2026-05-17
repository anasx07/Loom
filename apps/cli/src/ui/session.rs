use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Modifier, Style, Color};
use ratatui::text::{Line, Span, Text};
use ratatui::widgets::{Block, Borders, Paragraph, Wrap};
use ratatui::Frame;
use routecode_sdk::core::{Message, Role};
use unicode_width::UnicodeWidthStr;
use crate::ui::App;
use crate::ui::components::{COLOR_INPUT_BG, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_TEXT, COLOR_DIM, COLOR_SYSTEM, COLOR_SUCCESS, clean_model_name};

pub fn ui_session(f: &mut Frame, app: &mut App, area: Rect) -> Rect {
    let input_height = (app.input.lines().len() as u16 + 2).min(12);
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(1), Constraint::Length(input_height), Constraint::Length(1)])
        .split(area);

    // Compute thinking hover at render time using actual frame dimensions
    let thinking_hovered = crate::ui::compute_thinking_hover(app, f.size());
    app.thinking_hover_rendered = thinking_hovered;
    let is_collapsed = app.collapse_thinking && !app.temp_expand_thinking;

    let last_msg_len = app.history.last().map(|m| {
        m.content.as_ref().map(|s| s.len()).unwrap_or(0) +
        m.thought.as_ref().map(|s| s.len()).unwrap_or(0) +
        m.tool_calls.as_ref().map(|tc| tc.len()).unwrap_or(0)
    }).unwrap_or(0);

    let cache_valid = app.cached_text.is_some()
        && app.history.len() == app.cached_history_len
        && last_msg_len == app.cached_last_msg_len
        && chunks[0].width == app.cached_width
        && is_collapsed == app.cached_is_collapsed
        && thinking_hovered == app.cached_thinking_hovered;

    if !cache_valid {
        let history = render_history(&app.history, is_collapsed, thinking_hovered);
        
        // 1. Auto-scroll logic
        let mut total_height: usize = 0;
        let available_width = chunks[0].width.max(1) as usize;
        for line in &history.lines {
            let line_width: usize = line.spans.iter().map(|s| s.content.width()).sum();
            let wrapped_height = if line_width == 0 { 1 } else { 
                // Use a slightly smaller width for calculation to account for word wrapping
                let calc_width = (available_width as f32 * 0.95).floor() as usize;
                (line_width + calc_width - 1) / calc_width.max(1)
            };
            total_height += wrapped_height;
        }
        // Safety buffer
        total_height += 2;

        app.cached_history_len = app.history.len();
        app.cached_last_msg_len = last_msg_len;
        app.cached_width = chunks[0].width;
        app.cached_is_collapsed = is_collapsed;
        app.cached_thinking_hovered = thinking_hovered;
        app.cached_total_height = total_height;
        app.cached_text = Some(history);
    }

    let history_text = app.cached_text.as_ref().unwrap().clone();
    let total_height = app.cached_total_height;
    
    let max_scroll = total_height.saturating_sub(chunks[0].height as usize).min(u16::MAX as usize) as u16;
    app.max_scroll = max_scroll;
    
    if app.auto_scroll {
        app.history_scroll = max_scroll;
    } else {
        // Only re-enable auto-scroll if the user manually scrolls to the bottom of long content
        if app.history_scroll >= max_scroll && max_scroll > 0 {
            app.auto_scroll = true;
            app.history_scroll = max_scroll;
        }
    }

    f.render_widget(Paragraph::new(history_text).wrap(Wrap { trim: false }).scroll((app.history_scroll, 0)), chunks[0]);

    f.render_widget(Block::default().style(Style::default().bg(COLOR_INPUT_BG)), chunks[1]);
    
    let inner_input_area = Rect::new(
        chunks[1].x + 1,
        chunks[1].y + 1,
        chunks[1].width.saturating_sub(2),
        chunks[1].height.saturating_sub(2)
    );
    app.input.set_block(Block::default().borders(Borders::NONE));
    f.render_widget(app.input.widget(), inner_input_area);

    f.set_cursor(inner_input_area.x + app.input.cursor().1 as u16, inner_input_area.y + app.input.cursor().0 as u16);

    let spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let frame = spinner[(app.tick_count % spinner.len() as u64) as usize];
    
    let generating_text = if app.is_generating {
        if let Some(tool) = &app.active_tool {
            format!(" {} [Running {}...] ", frame, tool)
        } else {
            format!(" {} [Thinking...] ", frame)
        }
    } else {
        "".to_string()
    };

    let cleaned_model = clean_model_name(&app.current_model, &app.current_provider_id);
    
    let config_thinking = app.orchestrator.config.try_lock()
        .map(|c| c.thinking_level.clone())
        .unwrap_or("default".to_string());
    
    let thinking_tag = if config_thinking != "default" {
        format!(" • [{}] ", config_thinking)
    } else {
        "".to_string()
    };

    let status_layout = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Min(0),
            Constraint::Length(app.provider_name.len() as u16 + 2),
        ])
        .split(chunks[2]);

    let left_status = Line::from(vec![
        Span::styled(format!(" {} ", cleaned_model), Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD)),
        Span::styled(thinking_tag, Style::default().fg(COLOR_SYSTEM).add_modifier(Modifier::BOLD)),
        Span::styled(format!(" • Tokens: {} • Cost: ${:.4} ", app.usage.total_tokens, app.usage.total_cost), Style::default().fg(COLOR_SECONDARY)),
        Span::styled(format!(" • Scroll: {}/{} ", app.history_scroll, app.max_scroll), Style::default().fg(COLOR_SECONDARY).add_modifier(Modifier::DIM)),
        Span::styled(generating_text, Style::default().fg(COLOR_SYSTEM)),
        Span::styled(" • ctrl+o toggle thinking • ctrl+p help ", Style::default().fg(COLOR_SECONDARY).add_modifier(Modifier::DIM)),
    ]);

    let right_status = Paragraph::new(Span::styled(
        format!(" {} ", app.provider_name),
        Style::default().fg(COLOR_SECONDARY).add_modifier(Modifier::BOLD)
    )).alignment(ratatui::layout::Alignment::Right);

    f.render_widget(Paragraph::new(left_status), status_layout[0]);
    f.render_widget(right_status, status_layout[1]);

    chunks[1]
}

pub fn render_history(history: &[Message], collapse_thinking: bool, thinking_hovered: bool) -> Text<'static> {
    let mut lines = Vec::new();
    for m in history {
        match m.role {
            Role::User => {
                lines.push(Line::from(vec![
                    Span::styled(" ● User", Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD)),
                ]));
                if let Some(content) = &m.content {
                    for line in content.lines() {
                        lines.push(Line::from(vec![Span::raw("   "), Span::raw(line.to_string())]));
                    }
                }
            }
            Role::Assistant => {
                lines.push(Line::from(vec![
                    Span::styled(" ● RouteCode", Style::default().fg(COLOR_TEXT).add_modifier(Modifier::BOLD)),
                ]));
                
                if let Some(thought) = &m.thought {
                    if collapse_thinking {
                        if thinking_hovered {
                            lines.push(Line::from(vec![
                                Span::styled("   ┃ ", Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD)),
                                Span::styled("▶ Thinking... (Double click to expand, one hold click to see thought)", Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD)),
                            ]));
                        } else {
                            lines.push(Line::from(vec![
                                Span::styled("   │ ", Style::default().fg(COLOR_DIM)),
                                Span::styled("▶ Thinking... (ctrl+o to expand)", Style::default().fg(COLOR_SECONDARY).add_modifier(Modifier::ITALIC)),
                            ]));
                        }
                    } else {
                        if thinking_hovered {
                            lines.push(Line::from(vec![
                                Span::styled("   ┃ ", Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD)),
                                Span::styled("▼ Thinking... (Double click to collapse)", Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD)),
                            ]));
                        } else {
                            lines.push(Line::from(vec![
                                Span::styled("   │ ", Style::default().fg(COLOR_DIM)),
                                Span::styled("▼ Thinking... (ctrl+o to collapse)", Style::default().fg(COLOR_SECONDARY).add_modifier(Modifier::ITALIC)),
                            ]));
                        }

                        let guide = if thinking_hovered {
                            Span::styled("   ┃ ", Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD))
                        } else {
                            Span::styled("   │ ", Style::default().fg(COLOR_DIM))
                        };
                        
                        for line in thought.lines() {
                            let text = if thinking_hovered {
                                Span::styled(line.to_string(), Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::ITALIC))
                            } else {
                                Span::styled(line.to_string(), Style::default().fg(COLOR_SECONDARY).add_modifier(Modifier::ITALIC))
                            };
                            lines.push(Line::from(vec![guide.clone(), text]));
                        }
                    }
                }

                if let Some(tool_calls) = &m.tool_calls {
                    for tc in tool_calls {
                        let args: serde_json::Value = serde_json::from_str(&tc.function.arguments).unwrap_or(serde_json::json!({}));
                        let arg_preview = if let Some(path) = args["path"].as_str() {
                            format!("({})", path)
                        } else {
                            format!("({})", tc.function.name)
                        };
                        
                        lines.push(Line::from(vec![
                            Span::styled("   🛠 ", Style::default().fg(COLOR_PRIMARY)),
                            Span::styled(format!("Using {} ", tc.function.name), Style::default().fg(COLOR_TEXT)),
                            Span::styled(arg_preview, Style::default().fg(COLOR_SECONDARY).add_modifier(Modifier::DIM)),
                        ]));
                    }
                }

                if let Some(content) = &m.content {
                    let mut in_code_block = false;
                    for line in content.lines() {
                        if line.trim().starts_with("```") {
                            in_code_block = !in_code_block;
                            lines.push(Line::from(vec![Span::raw("   "), Span::styled(line.to_string(), Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD))]));
                        } else {
                            let mut line_spans = vec![Span::raw("   ")];
                            line_spans.extend(parse_markdown_line(line, in_code_block));
                            lines.push(Line::from(line_spans));
                        }
                    }
                }
            }
            Role::Tool => {
                lines.push(Line::from(vec![
                    Span::styled(format!("   ✓ Tool ({})", m.name.as_deref().unwrap_or("result")), Style::default().fg(COLOR_SECONDARY)),
                ]));
                if let Some(content) = &m.content {
                    if let Ok(res) = serde_json::from_str::<routecode_sdk::core::ToolResult>(content) {
                        if let Some(diff) = res.diff {
                            for line in diff.lines() {
                                let style = if line.starts_with('+') {
                                    Style::default().fg(COLOR_SUCCESS)
                                } else if line.starts_with('-') {
                                    Style::default().fg(Color::Red)
                                } else {
                                    Style::default().fg(COLOR_DIM)
                                };
                                lines.push(Line::from(vec![Span::raw("     "), Span::styled(line.to_string(), style)]));
                            }
                        } else if let Some(out) = res.content {
                            let preview = if out.len() > 100 {
                                let end = out.char_indices().map(|(i, _)| i).take_while(|&i| i <= 100).last().unwrap_or(0);
                                format!("{}...", &out[..end])
                            } else { out };
                            lines.push(Line::from(vec![Span::styled(format!("     {}", preview), Style::default().fg(COLOR_DIM).add_modifier(Modifier::DIM))]));
                        } else if let Some(err) = res.error {
                            lines.push(Line::from(vec![Span::styled(format!("     Error: {}", err), Style::default().fg(Color::Red))]));
                        }
                    } else {
                        let preview = if content.len() > 100 {
                            let end = content.char_indices().map(|(i, _)| i).take_while(|&i| i <= 100).last().unwrap_or(0);
                            format!("{}...", &content[..end])
                        } else { content.to_string() };
                        lines.push(Line::from(vec![Span::styled(format!("     {}", preview), Style::default().fg(COLOR_DIM).add_modifier(Modifier::DIM))]));
                    }
                }
            }
            Role::System => {
                lines.push(Line::from(vec![
                    Span::styled(" ● System", Style::default().fg(COLOR_SYSTEM).add_modifier(Modifier::DIM)),
                ]));
                if let Some(content) = &m.content {
                    lines.push(Line::from(vec![Span::styled(format!("   {}", content), Style::default().fg(COLOR_SYSTEM).add_modifier(Modifier::DIM))]));
                }
            }
        }
        lines.push(Line::from(""));
    }
    Text::from(lines)
}

fn parse_markdown_line<'a>(line: &'a str, in_code_block: bool) -> Vec<Span<'static>> {
    if in_code_block {
        return vec![Span::styled(line.to_string(), Style::default().fg(COLOR_SECONDARY))];
    }

    let trimmed = line.trim_start();
    let indent = &line[..line.len() - trimmed.len()];
    
    if trimmed.starts_with("# ") || trimmed.starts_with("## ") || trimmed.starts_with("### ") || trimmed.starts_with("#### ") {
        let mut spans = vec![Span::raw(indent.to_string())];
        spans.push(Span::styled(trimmed.to_string(), Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD)));
        return spans;
    } else if trimmed.starts_with("- ") || trimmed.starts_with("* ") {
        let mut spans = vec![
            Span::raw(indent.to_string()),
            Span::styled(trimmed[..2].to_string(), Style::default().fg(COLOR_PRIMARY).add_modifier(Modifier::BOLD)),
        ];
        spans.extend(parse_inline_markdown(&trimmed[2..]));
        return spans;
    }

    let mut spans = vec![Span::raw(indent.to_string())];
    spans.extend(parse_inline_markdown(trimmed));
    spans
}

fn parse_inline_markdown(text: &str) -> Vec<Span<'static>> {
    let mut spans = Vec::new();
    let mut current = String::new();
    let mut chars = text.chars().peekable();

    let mut bold = false;
    let mut italic = false;
    let mut code = false;

    while let Some(c) = chars.next() {
        if c == '`' {
            if !current.is_empty() {
                let mut style = Style::default();
                if code {
                    style = style.fg(COLOR_PRIMARY);
                } else {
                    if bold { style = style.add_modifier(Modifier::BOLD); }
                    if italic { style = style.add_modifier(Modifier::ITALIC); }
                }
                spans.push(Span::styled(current.clone(), style));
                current.clear();
            }
            code = !code;
            continue;
        }

        if !code && c == '*' {
            if let Some(&next_c) = chars.peek() {
                if next_c == '*' {
                    chars.next(); // Consume second '*'
                    if !current.is_empty() {
                        let mut style = Style::default();
                        if bold { style = style.add_modifier(Modifier::BOLD); }
                        if italic { style = style.add_modifier(Modifier::ITALIC); }
                        spans.push(Span::styled(current.clone(), style));
                        current.clear();
                    }
                    bold = !bold;
                    continue;
                }
            }
            if !current.is_empty() {
                let mut style = Style::default();
                if bold { style = style.add_modifier(Modifier::BOLD); }
                if italic { style = style.add_modifier(Modifier::ITALIC); }
                spans.push(Span::styled(current.clone(), style));
                current.clear();
            }
            italic = !italic;
            continue;
        }

        current.push(c);
    }

    if !current.is_empty() {
        let mut style = Style::default();
        if code {
            style = style.fg(COLOR_PRIMARY);
        } else {
            if bold { style = style.add_modifier(Modifier::BOLD); }
            if italic { style = style.add_modifier(Modifier::ITALIC); }
        }
        spans.push(Span::styled(current, style));
    }

    spans
}

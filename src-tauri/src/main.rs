#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod error;
mod models;
mod services;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::scan_all_skills,
            commands::discover_projects,
            commands::add_project,
            commands::remove_project,
            commands::install_skill_from_local,
            commands::install_skill_from_github,
            commands::delete_skill,
            commands::read_skill_manifest,
            commands::save_ui_preferences
        ])
        .run(tauri::generate_context!())
        .expect("error while running skill-manager");
}

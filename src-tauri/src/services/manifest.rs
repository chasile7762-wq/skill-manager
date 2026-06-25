use std::fs;
use std::path::Path;

use crate::error::AppError;
use crate::models::ParsedManifest;

pub fn parse_skill_manifest(skill_dir: &Path) -> Result<ParsedManifest, AppError> {
    let manifest_path = skill_dir.join("SKILL.md");
    if !manifest_path.exists() {
        return Err(AppError::new(
            "skill_manifest_missing",
            "Skill directory does not contain SKILL.md.",
        ));
    }

    let content = fs::read_to_string(manifest_path)?;
    Ok(parse_frontmatter(&content))
}

pub fn parse_frontmatter(content: &str) -> ParsedManifest {
    let mut lines = content.lines();
    if lines.next() != Some("---") {
        return ParsedManifest {
            name: None,
            description: None,
            raw_frontmatter: None,
        };
    }

    let mut raw = Vec::new();
    for line in lines.by_ref() {
      if line == "---" {
            break;
        }
        raw.push(line.to_string());
    }

    let raw_frontmatter = raw.join("\n");
    let name = raw
        .iter()
        .find_map(|line| line.strip_prefix("name:").map(|value| value.trim().trim_matches('"').to_string()));
    let description = raw.iter().find_map(|line| {
        line.strip_prefix("description:")
            .map(|value| value.trim().trim_matches('"').to_string())
    });

    ParsedManifest {
        name,
        description,
        raw_frontmatter: Some(raw_frontmatter),
    }
}

#[cfg(test)]
mod tests {
    use super::parse_frontmatter;

    #[test]
    fn parses_name_and_description() {
        let parsed = parse_frontmatter(
            "---\nname: my-skill\ndescription: helpful thing\n---\n# body\n",
        );

        assert_eq!(parsed.name.as_deref(), Some("my-skill"));
        assert_eq!(parsed.description.as_deref(), Some("helpful thing"));
    }
}

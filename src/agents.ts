import { homedir } from "node:os";
import { join } from "node:path";

const home = homedir();
const xdgConfig = process.env.XDG_CONFIG_HOME?.trim() || join(home, ".config");
const claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() || join(home, ".claude");
const codexHome = process.env.CODEX_HOME?.trim() || join(home, ".codex");

export interface AgentConfig {
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string;
}

export const agents: Record<string, AgentConfig> = {
  "claude-code": {
    displayName: "Claude Code",
    skillsDir: ".claude/skills",
    globalSkillsDir: join(claudeHome, "skills"),
  },
  cursor: {
    displayName: "Cursor",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".cursor/skills"),
  },
  openclaw: {
    displayName: "OpenClaw",
    skillsDir: "skills",
    globalSkillsDir: join(home, ".openclaw/skills"),
  },
  codex: {
    displayName: "Codex",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(codexHome, "skills"),
  },
  opencode: {
    displayName: "OpenCode",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(xdgConfig, "opencode/skills"),
  },
  windsurf: {
    displayName: "Windsurf",
    skillsDir: ".windsurf/skills",
    globalSkillsDir: join(home, ".codeium/windsurf/skills"),
  },
  amp: {
    displayName: "Amp",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(xdgConfig, "agents/skills"),
  },
  augment: {
    displayName: "Augment",
    skillsDir: ".augment/skills",
    globalSkillsDir: join(home, ".augment/skills"),
  },
  "gemini-cli": {
    displayName: "Gemini CLI",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".gemini/skills"),
  },
  "github-copilot": {
    displayName: "GitHub Copilot",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".copilot/skills"),
  },
};

export function resolveAgentDir(agent: string, global: boolean): string {
  const cfg = agents[agent];
  if (!cfg) {
    const known = Object.keys(agents).sort().join(", ");
    throw new Error(
      `Unknown agent "${agent}". Known agents: ${known}.\nFor anything else, use --outdir <path> to point at a custom location.`,
    );
  }
  return global ? cfg.globalSkillsDir : cfg.skillsDir;
}

export function knownAgentDirs(): { project: string[]; global: string[] } {
  const project = new Set<string>();
  const global = new Set<string>();
  for (const cfg of Object.values(agents)) {
    project.add(cfg.skillsDir);
    global.add(cfg.globalSkillsDir);
  }
  return { project: [...project], global: [...global] };
}

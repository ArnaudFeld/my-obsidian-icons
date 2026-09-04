/** Minimaler obsidian Ersatz nur für die Node Tests, nie im Plugin. */
export class App {}

export class TAbstractFile {
  path = "";
}

export class TFile extends TAbstractFile {
  extension = "";
}

export class TFolder extends TAbstractFile {}

export class WorkspaceLeaf {}

export function getIconIds(): string[] {
  return [];
}

export function setIcon(): void {}

export async function requestUrl(): Promise<never> {
  throw new Error("obsidian-stub: kein Netz in Tests");
}

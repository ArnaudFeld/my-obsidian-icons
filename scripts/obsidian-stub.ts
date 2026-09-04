/** Minimaler obsidian Ersatz nur für die Node Tests, nie im Plugin. */
export class StubVault {
  files = new Map<string, string>();

  getAbstractFileByPath(path: string): TFile | null {
    if (!this.files.has(path)) return null;
    return this.asFile(path);
  }

  getFiles(): TFile[] {
    return [...this.files.keys()].map((path) => this.asFile(path));
  }

  private asFile(path: string): TFile {
    const file = new TFile();
    file.path = path;
    const dot = path.lastIndexOf(".");
    file.extension = dot >= 0 ? path.slice(dot + 1) : "";
    return file;
  }

  async read(file: TFile): Promise<string> {
    const content = this.files.get(file.path);
    if (content === undefined) throw new Error(`fehlend: ${file.path}`);
    return content;
  }

  async modify(file: TFile, content: string): Promise<void> {
    this.files.set(file.path, content);
  }

  async create(path: string, content: string): Promise<TFile> {
    this.files.set(path, content);
    return this.getAbstractFileByPath(path) as TFile;
  }

  adapter = {
    mkdir: async (_dir: string): Promise<void> => {},
  };
}

export class App {
  vault = new StubVault();
}

export class TAbstractFile {
  path = "";
}

export class TFile extends TAbstractFile {
  extension = "";
}

export class TFolder extends TAbstractFile {}

export class WorkspaceLeaf {}

export class EditorSuggest<T> {
  app: App;
  limit = 0;
  context: null = null;
  constructor(app: App) {
    this.app = app;
  }
}

export function getIconIds(): string[] {
  return [];
}

export function setIcon(): void {}

export async function requestUrl(): Promise<never> {
  throw new Error("obsidian-stub: kein Netz in Tests");
}

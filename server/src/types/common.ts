export const enum SupportedLanguage {
    Rust = "rust",
    Python = "python"
}

// export const enum SupportedFormat {
//     Mermaid = "mermaid",
//     Tikz = "tikz"
// }

export type ImportStructure = { [key: string]: string[] | ImportStructure; };

export function isImportStructure(value: any): value is ImportStructure {
    if (typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    return Object.values(value).every(val => 
        Array.isArray(val) && (val.every(item => typeof item === 'string') || isImportStructure(val))
    );
}
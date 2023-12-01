import { ImportStructure } from "./types/common";
import { SupportedLanguage } from "./types/common";

export function extract_imports(input: Map<string, string>, language: SupportedLanguage): ImportStructure {
    const resultMap: ImportStructure = {};

    for (const [path, code] of input.entries()) {        
        const imports = extractSingle(code, language, path);
        setNestedValue(resultMap, path.split('/'), imports);
    }

    return resultMap;
}

function setNestedValue(obj: ImportStructure, pathArray: string[], value: string[]): void {
    let current = obj;
    for (let i = 0; i < pathArray.length - 1; i++) {
        const key = pathArray[i];
        if (!current[key]) {
            current[key] = {};
        }
        current = current[key] as ImportStructure;
    }
    current[pathArray[pathArray.length - 1]] = value;
}

function resolveImport(importString: string, filePath: string): string {
    if (importString.startsWith('crate::')) {
        // Remove 'crate::' and prepend the root path of your crate
        const rootPath = filePath.split('/')[0]; // Assuming the root of the crate is the first part of the filePath
        return `${rootPath}::${importString.slice(7)}`;
    } else if (importString.startsWith('super::')) {
        // Remove 'super::' and prepend the parent path of the current file
        const parentPath = filePath.split('/').slice(0, -1).join('::'); // Remove the last part of the filePath to get the parent path
        return `${parentPath}::${importString.slice(7)}`;
    } else {
        return importString;
    }
}

function extractSingle(code: string, language: SupportedLanguage, filepath: string): string[] {
    const imports: string[] = [];
    let isMultiLineImport = false;
    let multiLineImportContent = "";
    let multiLineImportBase = "";

    const lines = code.split("\n");
    for (let line of lines) {
        line = line.trim();

        switch (language) {
            case SupportedLanguage.Rust:
                if (isMultiLineImport) {
                    multiLineImportContent += line;
                    if (line.endsWith("};")) {
                        const i = multiLineImportContent.replace("use ", "").trimEnd().replace(";", "");
                        imports.push(...parseMultiLineImport(i).map(importString => resolveImport(importString, filepath)));
                        isMultiLineImport = false;
                        multiLineImportContent = "";
                        multiLineImportBase = "";
                    }
                } else if (line.startsWith("use") && line.includes("{") && !line.endsWith("};")) {
                    isMultiLineImport = true;
                    multiLineImportBase = line.split("{")[0].trim(); 
                    multiLineImportContent += line;
                } else if (line.startsWith("use") && line.includes("{") && line.endsWith("};")) {
                    const importBase = line.split("{")[0].trim(); 
                    const multipleImports = line.split("{")[1].split("}")[0].split(","); 
                    for (const singleImport of multipleImports) {
                        const i = `${importBase}{${singleImport.trim()}}`.replace("use ", "").trimEnd().replace(";", "");
                        imports.push(...parseMultiLineImport(i).map(importString => resolveImport(importString, filepath)));
                    }
                } else if (line.startsWith("use")) {                      
                    const i = line.replace("use ", "").trimEnd().replace(";", "");
                    imports.push(resolveImport(i, filepath));
                }
                break;
        }
    }

    return imports;
}

function parseMultiLineImport(importString: string): string[] {
    const imports: string[] = [];
    const stack: string[] = [];
    let currentImport = "";

    for (let i = 0; i < importString.length; i++) {
        const char = importString[i];
        if (char === '{') {
            if (currentImport.trim() !== '') {
                stack.push(currentImport.trim());
            }
            currentImport = "";
        } else if (char === '}') {
            if (currentImport.trim() !== '') {
                imports.push([...stack, currentImport.trim()].join("::"));
            }
            if (stack.length > 0) {
                stack.pop();
            }
            currentImport = "";
        } else if (char === ',') {
            if (currentImport.trim() !== '') {
                imports.push([...stack, currentImport.trim()].join("::"));
            }
            currentImport = "";
        } else {
            currentImport += char;
        }
    }

    // Handle the case where the import string does not end with a comma or a closing brace
    if (currentImport.trim() !== '') {
        imports.push([...stack, currentImport.trim()].join("::"));
    }

    return imports.map(i => i.replace("::::", "::"));
}



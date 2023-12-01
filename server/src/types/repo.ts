import axios from "axios";
const rateLimit = require('axios-rate-limit');
import { writeFile, readFile } from 'fs/promises';

import { SupportedLanguage, ImportStructure } from "./common";
import { extract_imports } from "../imports";
 
export class Repo {
    user: string;
    repo: string;
    branch: string;
    language: SupportedLanguage;
    subDir?: string;
    http: any;

    constructor(user: string, repo: string, branch: string = "main", language: SupportedLanguage, subDir?: string) {
        // console.log(`Initializing Repo with user: ${user}, repo: ${repo}, branch: ${branch}, language: ${language}, subDir: ${subDir}`);
        this.user = user;
        this.repo = repo;
        this.branch = branch;
        
        if (subDir) { 
            // console.log(`Subdirectory provided: ${subDir}`);
            this.subDir = subDir; 
        }

        if (language !== SupportedLanguage.Rust && language !== SupportedLanguage.Python) {
            console.error(`Unsupported language: ${language}`);
            throw new Error("Unsupported language");
        } else {
            this.language = language;
        }
        this.http = rateLimit(axios.create(), { maxRequests: 1, perMilliseconds: 1000, maxRPS: 1 });        
    }

    async getContentsURLs(): Promise<string[]> {
        // console.log(`Fetching contents URLs for repo: ${this.repo}`);
        var contents_url: string;
        if (this.subDir) { contents_url = `https://api.github.com/repos/${this.user}/${this.repo}/contents/${this.subDir}?ref=${this.branch}`; }
        else { contents_url = `https://api.github.com/repos/${this.user}/${this.repo}/contents/?ref=${this.branch}`; }
        const codeFiles: string[] = [];

        const response = await this.http.get(contents_url, { headers: { "Authorization": `token ${process.env.GITHUB_PAT}` } });

        if ('message' in response.data && response.data.message === "Not Found") { 
            console.error(`Repo not found: ${this.repo}`);
            throw new Error("Repo not found"); 
        }
        await Promise.all(response.data.map(async (file: any) => {
            switch (file.type) {
                case "file":
                    switch (this.language) {
                        case SupportedLanguage.Rust:
                            if (file.name.endsWith(".rs")) { codeFiles.push(file.download_url); }
                            break;
                        case SupportedLanguage.Python:
                            if (file.name.endsWith(".py")) { codeFiles.push(file.download_url); }
                            break;
                        default:
                            break;
                    }
                    break;
                case "dir":
                    // console.log(`Found directory: ${file.path}`);
                    const subRepo = new Repo(this.user, this.repo, this.branch, this.language, file.path);
                    const subFiles = await subRepo.getContentsURLs();  // Wait for the asynchronous operation to complete
                    codeFiles.push(...subFiles);
                    break;
                default:
                    break;
            }
        }));
        return codeFiles;
    }

    async getContents(outpath?: string): Promise<Map<string, string>> {
        // console.log(`Fetching contents for repo: ${this.repo}`);
        if (outpath) {
            try {                
                const data = await readFile(outpath, 'utf8');
                const contentsMap: Map<string, string> = new Map(JSON.parse(data));
                // console.log(`ContentsMap loaded from ${outpath}`);
                return contentsMap;
            } catch (error) {
                console.error(`Failed to read ContentsMap from ${outpath}:`, error);                
            }
        }
        
        console.log(`Generating new ContentsMap for repo: ${this.repo}, branch: ${this.branch}, language: ${this.language}`);

        const contents_urls = await this.getContentsURLs();
    
        var contents_map = new Map<string, string>();
        await Promise.all(contents_urls.map(async (url: string) => {
            try {
                const response = await this.http.get(url, { headers: { "Authorization": `token ${process.env.GITHUB_PAT}` } });
                if (response && response.data) {
                    contents_map.set(url.split(this.branch + '/')[1], response.data);
                } else {
                    console.error(`No data received for URL: ${url}`);
                }
            } catch (error) {
                console.error(`Error fetching content for URL: ${url}`, error);
            }
        }));

        console.log(`Successfully generated ContentsMap for repo: ${this.repo}, branch: ${this.branch}, language: ${this.language}`);
        
        if (outpath) {
            try {
                await writeFile(outpath, JSON.stringify(Array.from(contents_map.entries()), null, 2), 'utf8');
                console.log(`ContentsMap saved to ${outpath}`);
            } catch (error) {
                console.error(`Failed to save ContentsMap to ${outpath}:`, error);
            }
        }
    
        return contents_map;
    }

    async getImports(outpath?: string): Promise<ImportStructure> {
        // console.log(`Fetching imports for repo: ${this.repo}`);
        if (outpath) {
            try {                
                const data = await readFile(outpath, 'utf8');
                const importStructure: ImportStructure = JSON.parse(data);
                // console.log(`ImportStructure loaded from ${outpath}`);
                return importStructure;
            } catch (error) {
                console.error(`Failed to read ImportStructure from ${outpath}:`, error);                
            }
        }
        
        console.log(`Generating new ImportStructure for repo: ${this.repo}, branch: ${this.branch}, language: ${this.language}`);

        const contents = await this.getContents(outpath.replace('.json', '.contents.json'));
        const imports = extract_imports(contents, this.language);
    
        console.log(`Successfully generated ImportStructure for repo: ${this.repo}, branch: ${this.branch}, language: ${this.language}`);
        
        if (outpath) {
            try {
                await writeFile(outpath, JSON.stringify(imports, null, 2), 'utf8');
                console.log(`ImportStructure saved to ${outpath}`);
            } catch (error) {
                console.error(`Failed to save ImportStructure to ${outpath}:`, error);
            }
        }
    
        return imports;
    }
}



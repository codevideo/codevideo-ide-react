export function getLanguageFromFilename(filename: string | undefined): string {
    if (!filename) return 'plaintext';
    
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'php': 'php',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'rs': 'rust',
      'sh': 'shell',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml',
      // Add more mappings as needed
    };
    
    return extension && extension in extensionMap ? extensionMap[extension] : 'plaintext';
  }
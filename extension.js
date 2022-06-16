const EXTENSION_NAME = `md-file-tree-gen`;

const vscode = require('vscode');
const fs = require('fs');

const FileType = {
  File: 'file',
  Directory: 'directory',
  Unknown: 'unknown'
};

/**
 * ファイルの種類を取得する
 * 
 * @param {string} path パス
 * @return {string} ファイルの種類
 */
const getFileType = (path) => {
  try {
    const stat = fs.statSync(path);
    if (stat.isFile()) {
      return FileType.File;
    }
    if (stat.isDirectory()) {
      return FileType.Directory;
    }
    return FileType.Unknown;
  } catch (e) {
    return FileType.Unknown;
  }
};

/**
 * 指定したディレクトリ配下のすべてのファイルのフルパスをリストアップする
 * 
 * @param {string} dirPath 検索するディレクトリのパス
 * @return {Array<string>} ファイルのパスのリスト
 */
const listFiles = (dirPath) => {
  const fullpathList = [];
  const paths = fs.readdirSync(dirPath);

  paths.forEach(p => {
    const path = `${dirPath}/${p}`;

    const fileType = getFileType(path);

    if (fileType === FileType.Directory) {
      fullpathList.push(path);
      fullpathList.push(...listFiles(path));
    }

    if (fileType === FileType.File) {
      fullpathList.push(path);
    }
  })

  return fullpathList;
};

/**
 * 拡張機能が有効化された時に実行する関数
 * 
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
  const disposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.generateMarkdownFileTree`, () => {
    if (vscode.workspace.workspaceFolders === undefined) {
      const message = `${EXTENSION_NAME}: Working folder not found, open a folder an try again`;
      vscode.window.showErrorMessage(message);
      return;
    }

    // ==========================================================
    // 設定を取得
    // ==========================================================
    const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
    const outputFilename = config.get(`outputFilename`, `list.md`);
    const ignoreFilenameList = config.get(`ignore`, []);

    // ==========================================================
    // ワークスペースのパスを取得
    // ==========================================================
    const workspaceDirPath = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, '/');

    // ==========================================================
    // ファイルパスリストを取得
    // ==========================================================
    const list = listFiles(workspaceDirPath);

    // ==========================================================
    // ファイルパスリストを整形
    // ==========================================================
    const filteredList = list
      .map(path => {
        // フルパスの中で不要な部分を削除
        return path.replace(workspaceDirPath + `/`, ``).replace(/\\/g, '/');
      })
      .filter(path => {
        // 設定ファイルで対象外になっているものを除外
        for (const ignore of ignoreFilenameList) {
          if (path.includes(ignore)) {
            return false;
          }
        }
        return true;
      })
      .map((path, rowIdx) => {
        // 見出し
        if (path.includes(`/`) === false) {
          if (rowIdx === 0) {
            return `# [${path}](${path})`;
          }
          return `\n# [${path}](${path})`;
        }

        // 資料
        const filename = path.split(`/`).pop();
        const markdownLinkText = `- [${filename}](${path})`;
        const depth = path.split(`/`).length - 2;
        if (0 < depth) {
          const indent = '  '.repeat(depth);
          return indent + markdownLinkText;
        }
        return markdownLinkText;
      });

    // ==========================================================
    // 結果をファイル出力
    // ==========================================================
    const result = filteredList.join(`\n`);
    fs.writeFileSync(`${workspaceDirPath}/${outputFilename}`, result, `utf8`);
  });

  context.subscriptions.push(disposable);
};

/**
 * 拡張機能が無効化された時に実行する関数
 */
const deactivate = () => {
  // NOP
};

module.exports = {
  activate,
  deactivate
};

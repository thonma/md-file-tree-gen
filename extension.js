const vscode = require('vscode');
const fs = require('fs');

const FileType = {
  File: 'file',
  Directory: 'directory',
  Unknown: 'unknown'
};

/**
 * ファイルの種類を取得する
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
}

/**
 * 指定したディレクトリ配下のすべてのファイルをリストアップする
 * 
 * @param {string} dirPath 検索するディレクトリのパス
 * @return {Array<string>} ファイルのパスのリスト
 */
const listFiles = (dirPath) => {
  const ret = [];
  const paths = fs.readdirSync(dirPath);

  paths.forEach(a => {
    const path = `${dirPath}/${a}`;

    const fileType = getFileType(path);

    if (fileType === FileType.Directory) {
      ret.push(...listFiles(path));
    }

    if (fileType === FileType.File) {
      ret.push(path);
    }
  })

  return ret;
};

/**
 * 出力対象のファイルパスかどうかを返す
 * 
 * @param {string} path 
 * @returns 
 */
const filterPath = (path) => {
  if (path.startsWith(`.git`) || path.startsWith(`images`) || path.startsWith(`tmp`)) {
    return false;
  }
  if (path.includes(`PDF原本`) || path.includes(`ツール類`) || path.includes(`ボツ課題`) || path.includes(`講師用`)) {
    return false;
  }
  if (path.startsWith(`/README.md`)) {
    return false;
  }
  if (path.includes(`/`) === false) {
    return false;
  }
  return true;
}

/**
 * ファイルパスをマークダウンのリンクにする
 * 
 * @param {string} path 
 * @returns 
 */
const toMdLink = (path) => {
  return `- [${path}](${path})`;
}

/**
 * 拡張機能が有効化された時に実行する関数
 * 
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
  const disposable = vscode.commands.registerCommand(`md-file-tree-gen.generateMarkdownFileTree`, () => {
    if (vscode.workspace.workspaceFolders === undefined) {
      const message = `md-file-tree-gen: Working folder not found, open a folder an try again`;
      vscode.window.showErrorMessage(message);
      return;
    }

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
      .map(item => item.replace(/\\/g, '/').replace(workspaceDirPath + `/`, ``))
      .filter(filterPath)
      .map(toMdLink);

    for (let i = 0; i < filteredList.length - 1; i++) {
      const curr = filteredList[i];
      const next = filteredList[i + 1];

      if (curr.substring(0, 5) !== next.substring(0, 5)) {
        filteredList[i] += `\n`;
        const headText = next.split(`/`)[0].replace(`- [`, ``);
        filteredList.splice(i + 1, 0, `# ${headText}`);
        i++;
      }
    }
    const head0 = filteredList[0].split(`/`)[0].replace(`- [`, ``);
    filteredList.unshift(`# ${head0}`);

    // ==========================================================
    // 結果をファイル出力
    // ==========================================================
    const result = filteredList.join(`\n`);
    fs.writeFileSync(`${workspaceDirPath}/資料一覧.md`, result, `utf8`);
  });

  context.subscriptions.push(disposable);
}

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

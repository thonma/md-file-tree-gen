# md-file-tree-gen
フォルダ構成を参照して以下のようなマークダウンファイルを出力するVSCode拡張

```
# directory0
- [hoge](/directory0/.../hoge)
- [fuga](/directory0/.../fuga)
- [piyo](/directory0/.../piyo)

# directory1
- [hoge](/directory1/.../hoge)
- [fuga](/directory1/.../fuga)
- [piyo](/directory1/.../piyo)

# directory2
- [hoge](/directory1/.../hoge)
  - [fuga](/directory1/.../fuga)
  - [piyo](/directory1/.../piyo)
```

# Cloudi-Fi Theme Kit

A developer tool which handles files watch & compile

## Requirements

NodeJS v12 minimum

## Usage A (not recommended because of potential issues)

- Install globally:
`yarn global add bitbucket:JulienCabanes/cloudifi-theme-kit#v2.5.0`

- Run `cloudifi-theme-kit` in any folder containing themes, don't forget to also have parent themes in this folder, with symlinks if necessary.

## Usage B

- Edit your `package.json` and add this to `devDependencies`:
`"cloudifi-theme-kit": "bitbucket:Cloudi-Fi/cloudifi-theme-kit#v2.5.0"`

- Edit your `package.json` and add this to `scripts`:
`"watch": "cloudifi-theme-kit"`

- Run `yarn run watch`

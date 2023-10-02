# SAM Layouts

## Homepage
https://gsa.github.io/sam-layouts/

## Publish @gsa-sam/layouts package

``` bash
# Publish to npm
# Update libs/layout/package.json with new version then run..
npm run build:layouts
cd dist/libs/layouts/
npm publish

# Publish to GSA Artifactory
cd dist/libs/layouts/
npm pack
# Upload to GSA Artifactory
```

## Run docs site
``` bash
# http://localhost:4400
npm run storybook
```

## Publish docs

```bash

# Update docs folder with latest code
 npm run build:storybook
 
## Push update docs folder to master brach
 ```
 
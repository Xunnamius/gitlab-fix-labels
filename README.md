[![npm version](https://badge.fury.io/js/gitlab-fix-labels.svg)](https://badge.fury.io/js/gitlab-fix-labels)

# GITLAB-FIX-LABELS

This tool will delete **ALL** labels from **ALL** visible projects and replace them all in **EVERY project** with your **GLOBAL [GitLab](https://gitlab.com) admin labels**. You can also specify this happen to a **specific project** rather than every project your token can access.

This was built to [address](https://gitlab.com/gitlab-org/gitlab-ce/issues/834) these [issues](https://github.com/clns/gitlab-cli/issues/13) with [GitLab](https://gitlab.com/gitlab-org/gitlab-ce/issues/12707).

Also does children's parties.

## Installation

```shell
npm install gitlab-fix-labels
```

## Usage

To get a help message:
```shell
gitlab-fix-labels
```

To completely replace the labels on one project with your custom admin global defaults (set in the administrator area of GitLab):
```shell
gitlab-fix-labels API_STARTPOINT_URI API_AUTH_TOKEN TARGET_PROJECT_ID_NUMBER
```

To completely replace the labels on ALL projects with your custom admin global
defaults (set in the administrator area of GitLab):
```shell
gitlab-fix-labels API_STARTPOINT_URI API_AUTH_TOKEN
```

## Examples

```shell
gitlab-fix-labels https://git.mysite.org/api/v4 myspecial_tokenhere 10
gitlab-fix-labels https://newgitlab.com/api/v5 my2ndspecial_tokenhere
gitlab-fix-labels http://git.lol/api/v4/ myotherspecial_tokenhere
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.

Lint and test your code!

## Release History

* 0.1.x Rapid iteration; initial working release

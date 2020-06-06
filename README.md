[![npm version](https://badge.fury.io/js/gitlab-fix-labels.svg)](https://badge.fury.io/js/gitlab-fix-labels)

# GITLAB-FIX-LABELS

This tool will help propagate into the repos of your choice those nice shiny new [GitLab](https://gitlab.com) global admin labels you worked so hard on. See below.

This was built to [address](https://gitlab.com/gitlab-org/gitlab-ce/issues/834) these [issues](https://github.com/clns/gitlab-cli/issues/13) with [GitLab](https://gitlab.com/gitlab-org/gitlab-ce/issues/12707).

## Installation

```shell
npm install -g gitlab-fix-labels
```

## Usage

General command syntax:

```shell
gitlab-fix-labels GITLAB_API_STARTPOINT_URI YOUR_AUTH_TOKEN YOUR_ACTION YOUR_TARGET
```

Possible actions:

`add` - add your admin labels to your target repo(s); existing labels will not be touched; any duplicates will be skipped.

`delete` - completely and utterly delete all of a repository's labels.

`replace` - the same as calling `delete` followed by `add`.

Your target:

The target must either be the string `all` (case sensitive) or an integer larger than 0.

## Examples

```shell
gitlab-fix-labels https://git.mysite.org/api/v4 myspecial_tokenhere add 10
gitlab-fix-labels https://newgitlab.com/api/v5 my2ndspecial_tokenhere delete all
gitlab-fix-labels http://git.lol/api/v4/ myotherspecial_tokenhere replace all
gitlab-fix-labels http://git.lol/api/v5/ special_token2 replace 555
```

To completely replace the labels on one project with your custom admin global
defaults (set in the administrator area of GitLab):

```shell
gitlab-fix-labels GITLAB_API_STARTPOINT_URI YOUR_AUTH_TOKEN replace YOUR_TARGET
```

To completely replace the labels on ALL projects with your global admin defaults:

```shell
gitlab-fix-labels GITLAB_API_STARTPOINT_URI YOUR_AUTH_TOKEN replace all
```

To append your global admin defaults to ALL projects (not deleting existing labels):

```shell
gitlab-fix-labels GITLAB_API_STARTPOINT_URI YOUR_AUTH_TOKEN add all
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.

Lint and test your code!

## Release History

* 0.1.x Rapid iteration; initial working release
* 0.1.4 Implement #1, added action interface to CLI; fixed a few minor bugs
* 0.2.1 Added new commands, changed interface, added more helpful help text
* 0.2.2 Fixed per_page bug
* 0.2.3 Minor changes

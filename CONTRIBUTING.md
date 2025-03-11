# Contributing to QuickyTrade

First off, thank you for considering contributing to QuickyTrade! It's people like you that make QuickyTrade such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for QuickyTrade. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

Before creating bug reports, please check [this list](#before-submitting-a-bug-report) as you might find out that you don't need to create one. When you are creating a bug report, please [include as many details as possible](#how-do-i-submit-a-good-bug-report).

#### Before Submitting A Bug Report

* Check the [documentation](README.md).
* Check if you can reproduce the problem in the latest version.
* Search the [issues](https://github.com/0xrm1/quickytrade/issues) to see if the problem has already been reported.

#### How Do I Submit A Good Bug Report?

Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). Create an issue and provide the following information:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots and animated GIFs if possible
* Include your environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for QuickyTrade, including completely new features and minor improvements to existing functionality.

#### Before Submitting An Enhancement Suggestion

* Check if the enhancement has already been suggested or implemented.
* Check if there's already a package that provides that enhancement.

#### How Do I Submit A Good Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://guides.github.com/features/issues/). Create an issue and provide the following information:

* Use a clear and descriptive title
* Provide a detailed description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful
* List some other applications where this enhancement exists, if applicable
* Include screenshots and animated GIFs if relevant

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the [styleguides](#styleguides)
* Include screenshots and animated GIFs in your pull request whenever possible

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
    * 🎨 `:art:` when improving the format/structure of the code
    * 🐎 `:racehorse:` when improving performance
    * 🚱 `:non-potable_water:` when plugging memory leaks
    * 📝 `:memo:` when writing docs
    * 🐛 `:bug:` when fixing a bug
    * 🔥 `:fire:` when removing code or files
    * 💚 `:green_heart:` when fixing the CI build
    * ✅ `:white_check_mark:` when adding tests
    * 🔒 `:lock:` when dealing with security
    * ⬆️ `:arrow_up:` when upgrading dependencies
    * ⬇️ `:arrow_down:` when downgrading dependencies

### JavaScript Styleguide

* Use TypeScript
* Use semicolons
* 2 spaces for indentation
* Prefer `const` over `let`
* Use template literals instead of string concatenation
* Use arrow functions over anonymous function expressions
* Use async/await over Promise chains
* Add trailing commas
* Use meaningful variable names

### Documentation Styleguide

* Use [Markdown](https://guides.github.com/features/mastering-markdown/)
* Reference methods and classes in markdown with the following syntax:
    * Class: `ClassName`
    * Method: `Class#methodName`
* Use one line per sentence in documentation files

## Additional Notes

### Issue and Pull Request Labels

This section lists the labels we use to help us track and manage issues and pull requests.

#### Type of Issue and Issue State

* `enhancement`: Feature requests
* `bug`: Confirmed bugs or reports that are very likely to be bugs
* `question`: Questions more than bug reports or feature requests
* `feedback`: General feedback
* `help-wanted`: The core team would appreciate help from the community in resolving these issues
* `beginner`: Less complex issues which would be good first issues to work on for users who want to contribute
* `more-information-needed`: More information needs to be collected about these problems or feature requests
* `needs-reproduction`: Likely bugs, but haven't been reliably reproduced
* `blocked`: Issues blocked on other issues
* `duplicate`: Issues which are duplicates of other issues
* `wontfix`: The core team has decided not to fix these issues for now
* `invalid`: Issues which aren't valid (e.g., user errors)

#### Pull Request Labels

* `work-in-progress`: Pull requests which are still being worked on, more changes will follow
* `needs-review`: Pull requests which need code review, and approval from maintainers
* `under-review`: Pull requests being reviewed by maintainers
* `requires-changes`: Pull requests which need to be updated based on review comments
* `needs-testing`: Pull requests which need manual testing 
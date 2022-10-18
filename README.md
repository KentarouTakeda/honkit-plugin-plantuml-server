# HonKit PlantUML Plugin

[![npm version](https://badge.fury.io/js/honkit-plugin-plantuml-server.svg)](https://badge.fury.io/js/honkit-plugin-plantuml-server)
![test](https://github.com/KentarouTakeda/honkit-plugin-plantuml-server/actions/workflows/test.yml/badge.svg?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

PlantUML plugin for HonKit. **No Java or Graphviz required** .

The plugin supports APIs  as follows for generating UML diagrams.

* [PlantUML Online Server](http://www.plantuml.com/plantuml/)
* Your own [PlantUML Server](https://github.com/plantuml/plantuml-server)

The plugin uses plantuml online server by default, so it works with **zero-config** .

In this case your diagram is rendered on a public server. If you care about privacy, I recommend building your own server.

## Installation

* Execute the following command.
  ```sh
  npm install honkit-plugin-plantuml-server
  ```
* Write the following in `book.json`.
  ```json
  {
    "plugins": [
      "plantuml-server"
    ]
  }
  ```

## How To Use

### Inline

Write a code block quote specified to the `plantuml` language in markdown.

For example, if you write the following in README.md.

<pre>
# Introduction

```plantuml
Bob->Alice : Hello!
```
</pre>
*NOTE: You can also use `uml` / `puml` as the language specification.*

Then it will be displayed like this.

![](images/example.png)

HTML is authored for example as follows.

```html
<figure class="plantuml">
  <img src="data:image/svg+xml;base64,........">
</figure>
```
*NOTE: You can change the CSS class name as you like.*

### External file

If you specify a relative path, it will read the path relative to the original markdown. For example:

```
{% uml src="path/to/uml" %}
{% enduml %}
```

If you specify an absolute path, it will be read based on the root folder of the books defined by `book.json`.  For example:

```
{% uml src="/path/to/uml" %}
{% enduml %}
```

*NOTE: Modifications other than markdown files are not supported by `honkit serve` hot reload.*

## Configuration

|Option|Default|Description|
|-|-|-|
|server|*http://www.plantuml.com/plantuml/* |URL for rendering on your own server|
|format|*svg*|Supports *png* and *svg*|
|cacheDir|`os.tmpdir()`|Directory to cache rendered results. If `null` is specified, cache is not used.|
|cssClass|plantuml|CSS class name given to the rendered figure.|
|optimizeImage|true|Whether to remove metadata from rendered results|

A `book.json` describing these would look like this, for example:

```json
{
  "plugins": [
    "plantuml-server"
  ],
  "pluginsConfig": {
    "plantuml-server": {
      "server": "http://your-server.local/plantuml/",
      "format": "png",
      "cacheDir": "/tmp",
      "cssClass": "customClassName",
      "optimizeImage": false
    }
  }
}
```

## Contributing and Development

```sh
$ git clone https://github.com/KentarouTakeda/honkit-plugin-plantuml-server.git
$ cd honkit-plugin-plantuml-server
$ npm install
$ npm test
```

## License

HonKit PlantUML Plugin is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

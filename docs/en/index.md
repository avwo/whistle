---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Whistle"
  text: "Cross-platform network debugging proxy"
  tagline: Provides professional-level packet capture debugging solutions, experience simple operations like blowing a whistle
  image: /img/whistle.png
  actions:
    - theme: brand
      text: Whistle client version
      link: https://github.com/avwo/whistle-client
    - theme: alt
      text: Whistle command line version
      link: https://github.com/avwo/whistle

features:
  - title: Powerful
    details: Supports HTTP/HTTPS/SOCKS/reverse proxy, can intercept and modify mainstream network protocol traffic, built-in debugging tools such as Weinre
  - title: Simple operation
    details: Modify requests/responses by configuring rules, and provide a one-stop interface including viewing packet capture, configuring rules, managing plug-ins and debugging tools
  - title: Extensible
    details: Functions can be extended through plug-ins, or used as NPM module dependencies
  - title: Cross-platform
    details: Supports macOS/Windows/Linux mainstream desktop systems and non-header servers
---

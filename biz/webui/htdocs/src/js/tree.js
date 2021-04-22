const LEAF_DELIMITER = '__LEAF__';

const parse = ({ url, id, method }) => {
  try {
    if (/connect/i.test(method)) {
      return {
        queue: url.split(':').slice(0, 1),
        search: '',
      };
    }

    const { origin, pathname, search } = new URL(url);
    let result = [origin, ...pathname.slice(1).split('/')];

    if (pathname.indexOf(LEAF_DELIMITER) === -1 && id) {
      let leaf = result.pop();
      leaf += LEAF_DELIMITER + id;
      result = [...result, leaf];
    }

    return {
      queue: result,
      search: search.slice(0, 200),
    };
  } catch (error) {
    console.error('parse url fail', url);
    return null;
  }
};

const prune = (url) => {
  if (!url || !RegExp(LEAF_DELIMITER).test(url)) {
    return url;
  }
  return url.split(LEAF_DELIMITER)[0];
};

const dfs = ({
  node,
  callback,
  filter,
}) => {
  let stack = [node];

  while (stack.length > 0) {
    const item = stack.shift();
    if (!item) {
      continue;
    }

    if (Array.isArray(item.children) && item.children.length > 0) {
      if (typeof filter === 'function' && filter(item)) {
        continue;
      }
      stack.unshift(...item.children);
    }

    callback(item);
  }
};

class Tree {
  // contains all tree node
  root = {};
  // map tree node id (prefix) to request list index
  map = new Map();
  // contains all unfolded node
  queue = [];

  constructor(list) {
    if (Array.isArray(list) && list.length > 0) {
      list.forEach((item, index) => this.insert({ ...item, index }));
    }
  }

  // find target node
  // or closest parent
  search(data) {
    if (!data) {
      return;
    }

    const result = parse(data);
    if (!result) {
      return;
    }

    const {
      queue,
      search,
    } = result;

    let node = this.root;
    let depth = -1;
    let highlight = queue[0];

    // node: parent node
    // queue: url path queue
    while (node && queue.length) {
      const item = queue[0];
      if (!item) {
        break;
      }

      if (!node.childrenMap || node.childrenMap.size <= 0) {
        break;
      }

      const next = node.childrenMap.get(item);
      if (typeof next !== 'number') {
        break;
      }

      let temp = node.children[next];
      if (!temp) {
        break;
      }

      node = temp;
      queue.shift();
      ++depth;

      if (this.queue.indexOf(node.id) > -1) {
        highlight = node.id;
      }
    }

    return {
      node,
      queue,
      depth,
      search,
      highlight,
    };
  }

  // 1. insert node
  // 2. update queue
  insert(data) {
    if (!data) {
      return;
    }

    if (this.update(data)) {
      return;
    }

    const result = this.search(data);
    if (!result) {
      return;
    }

    const { index } = data;

    let {
      node,
      queue,
      depth,
      search,
      highlight,
    } = result;

    let child = null;

    while (node && queue.length) {
      const item = queue.shift();
      if (!item) {
        continue;
      }

      if (!node.childrenMap) {
        node.childrenMap = new Map();
        node.children = [];
      }

      let prefix = item;
      if (node.id) {
        prefix = `${node.id}/${item}`;
      }
      const isLeaf = queue.length < 1;

      let next = node.childrenMap.get(item);

      let temp = {
        value: item, // for tree
        id: prefix, // for map & list
        parent: node,
      };

      if (!isLeaf) {
        temp.children = [];
        temp.childrenMap = new Map();
      }

      next = node.children.length;
      node.children.push(temp);
      node.childrenMap.set(item, next);

      this.map.set(prefix, {
        index: isLeaf ? index : -1, // request list index
        search, // for render
        value: prune(item), // for render
        depth: ++depth,
        fold: true,
      });

      node = node.children[next];

      if (child === null) {
        child = node;
      }
    }

    return this.flush({
      parent: highlight,
      child,
    });
  }

  update(data) {
    const id = Tree.parse(data);
    if (!id || !this.map.has(id)) {
      return false;
    }

    const item = this.map.get(id);
    const { index } = data;
    this.map.set(id, {
      ...item,
      index,
    });

    return true;
  }

  // 1. find the closest unfolded parent
  // 2. insert after parent's last visible child
  // 3. update queue
  flush({
    parent,
    child,
  }) {
    if (!child) {
      return parent;
    }

    let start = this.queue.indexOf(parent);

    if (child.parent.id === parent) {
      const p = this.map.get(parent);
      if (p && !p.fold) {
        const end = this.queue.length;

        while (++start < end) {
          if (!this.queue[start].startsWith(parent)) {
            break;
          }
        }

        if (start < end) {
          this.queue.splice(start, 0, child.id);
        } else {
          this.queue.push(child.id);
        }

        return child.id;
      }
    }

    if (start === -1) {
      this.queue.push(parent);
    }

    return parent;
  }

  // DFS delete node
  // 1.1 down: node + children
  // 1.2 up: node + parent(s)
  // 2. update queue
  delete(data) {
    if (!data) {
      return;
    }

    const result = this.search(data);
    if (!result) {
      return;
    }

    const callback = (node) => {
      const { parent, value, id } = node;

      if (!parent) {
        return;
      }

      // remove node
      let index = parent.childrenMap.get(value);
      // replace node with placeholder
      // because children map uses original index
      parent.children[index] = null;
      parent.childrenMap.delete(value);

      // remove map
      this.map.delete(id);

      // remove list
      index = this.queue.indexOf(id);
      if (index > -1) {
        this.queue.splice(index, 1);
      }
    };

    let { node } = result;

    dfs({
      node,
      callback,
    });

    while (node && node.parent) {
      node = node.parent;
      if (node.childrenMap && node.childrenMap.size >= 1) {
        break;
      }
      callback(node);
    }
  }

  clear() {
    this.root = {};
    this.map.clear();
    this.queue = [];
    return this.queue;
  }

  toggle({
    id: url,
    next,
    recursive = false,
  }) {
    // invalid url
    if (!url || !this.map.has(url)) {
      return;
    }

    // url is invisible
    let index = this.queue.indexOf(url);
    if (index === -1) {
      return;
    }

    // find target node
    const result = this.search({ url });
    if (!result) {
      return;
    }

    // next state
    const item = this.map.get(url);
    if (typeof next !== 'boolean') {
      next = !item.fold;
    }
    this.map.set(url, {
      ...item,
      fold: next,
    });

    let { node } = result;
    let queue = [];
    let delta = 0;

    const callback = (node) => {
      const { id } = node;
      // not including target
      if (id === url) {
        return;
      }

      // exist node in list
      if (this.queue.indexOf(id) > -1) {
        ++delta;
      }

      // recursive or node.parent = unfold
      let valid = recursive;
      if (!valid) {
        if (node.parent.id) {
          const config = this.map.get(node.parent.id);
          if (config && !config.fold) {
            valid = true;
          }
        }
      }
      if (valid) {
        queue.push(id);
      }

      // set next state
      if (recursive) {
        const item = this.map.get(id);
        this.map.set(id, {
          ...item,
          fold: next,
        });
      }
    };

    dfs({
      node,
      callback,
      filter: (current) => {
        if (!next && !recursive) {
          const {id} = current;
          const item = this.map.get(id);
          if (item && item.fold) {
            callback(current);
            return true;
          }
        }
        return false;
      },
    });

    // fold
    let options = [index + 1, delta];
    // unfold
    if (!next) {
      options = options.concat(queue);
    }
    this.queue.splice(...options);
  }

  // parse request url + id to tree id
  static parse(data) {
    const result = parse(data);
    if (!result) {
      return '';
    }

    const {
      queue,
    } = result;

    return queue.join('/');
  }
}

module.exports = Tree;

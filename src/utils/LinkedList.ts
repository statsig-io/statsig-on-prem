interface IndexableItem {
  id: string;
}

class Node<T extends IndexableItem> {
  public prev: Node<T> | null;
  public next: Node<T> | null;

  constructor(private value: T) {
    this.prev = null;
    this.next = null;
  }

  getID(): string {
    return this.value.id;
  }
  getValue(): T {
    return this.value;
  }
  setValue(value: T): void {
    this.value = value;
  }
}

/**
 * Utility class to manage an ordered list uniquely indexed items
 * with fast lookup, mutations, and re-ordering.
 */
export default class LinkedList<T extends IndexableItem> {
  private _head: Node<T> | null;
  private _tail: Node<T> | null;
  private _lookup: Map<string, Node<T>>;

  constructor(items: T[]) {
    this._head = null;
    this._tail = null;
    this._lookup = new Map<string, Node<T>>();

    items.forEach((item) => this.add(item));
  }

  /**
   * Add an item to the end of the list
   */
  add(item: T): void {
    const node = new Node(item);

    if (!this._head) {
      this._head = node;
      this._tail = node;
    } else {
      if (this._tail) {
        this._tail.next = node;
        node.prev = this._tail;
        this._tail = node;
      }
    }

    this._lookup.set(item.id, node);
  }

  /**
   * Update an item in the list
   */
  update(item: T): void {
    const node = this._lookup.get(item.id);
    if (node) {
      node.setValue(item);
    }
  }

  /**
   * Delete an item in the list
   */
  delete(item: T): void {
    const node = this._lookup.get(item.id);
    if (node) {
      if (node.prev) {
        node.prev.next = node.next;
      } else {
        this._head = node.next;
      }

      if (node.next) {
        node.next.prev = node.prev;
      } else {
        this._tail = node.prev;
      }

      this._lookup.delete(item.id);
    }
  }

  /**
   * Swap an item with another item in the list
   */
  swap(itemA: T, itemB: T): void {
    const nodeA = this._lookup.get(itemA.id);
    const nodeB = this._lookup.get(itemB.id);

    if (!nodeA || !nodeB) {
      return;
    }

    nodeA.setValue(itemB);
    nodeB.setValue(itemA);
  }

  /**
   * Get the previous item in the list
   */
  getPrev(item: T): T | null {
    const node = this._lookup.get(item.id);
    if (!node || !node.prev) {
      return null;
    }
    const prevNode = this._lookup.get(node.prev.getID());
    if (!prevNode) {
      return null;
    }
    return prevNode.getValue();
  }

  /**
   * Get the next item in the list
   */
  getNext(item: T): T | null {
    const node = this._lookup.get(item.id);
    if (!node || !node.next) {
      return null;
    }
    const nextNode = this._lookup.get(node.next.getID());
    if (!nextNode) {
      return null;
    }
    return nextNode.getValue();
  }

  /**
   * Returns the size of the list
   */
  size(): number {
    return this._lookup.size;
  }

  /**
   * Returns the list in the form of a Typescript array
   */
  toArray(): T[] {
    let res: T[] = [];
    let cursor = this._head;
    while (cursor) {
      res.push(cursor.getValue());
      cursor = cursor.next;
    }
    return res;
  }
}

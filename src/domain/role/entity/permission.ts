export default class Permission {
  private _id: string;
  private _name: string;
  private _resource: string;
  private _action: string;
  private _description?: string = '';

  constructor(id: string, name: string, resource: string, action: string, description?: string) {
    this._id = id;
    this._name = name;
    this._resource = resource;
    this._action = action;
    this._description = description ?? '';
    this.validate();
  }

  validate(): void {
    if (!this._id) {
      throw new Error('Permission ID is required');
    }
    if (!this._name) {
      throw new Error('Permission name is required');
    }
    if (!this._resource) {
      throw new Error('Permission resource is required');
    }
    if (!this._action) {
      throw new Error('Permission action is required');
    }
  }

  changeDescription(description?: string): void {
    this._description = description ?? '';
  }
}

// Augment global Fetch Response to return Promise<any> for .json()
// avoiding TS18046 ('data' is of type 'unknown') across components
interface Body {
  json(): Promise<any>;
}

interface Response {
  json(): Promise<any>;
}

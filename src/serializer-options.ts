import { Links, AttributesObject, caseOptions, RelationshipMeta} from './types';

export interface SerializerOptions {
  [index: string]: any,
  id: string,
  attributes: Array<string>,
  topLevelLinks?: Links,
  keyForAttribute?: ((attribute: string) => string) | caseOptions,
  ref?: string | boolean | Function,
  typeForAttribute?: (attribute: any, user: any) => any,
  nullIfMissing?: boolean,
  pluralizeType?: boolean,
  ignoreRelationshipData?: boolean,
  relationshipLinks?: Links,
  relationshipMeta?: RelationshipMeta,
  dataLinks?: Links,
  included?: boolean,
  includedLinks?: Links,
  embed?: boolean,
  meta?: any
}

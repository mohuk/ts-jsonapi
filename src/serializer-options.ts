import { Links, AttributesObject, caseOptions, RelationshipMeta} from './types';

export interface SerializerOptions {
  id?: string,
  topLevelLinks: Links,
  attributes?: Array<string>,
  keyForAttribute: (attribute: string) => string | caseOptions,
  ref: string | boolean | Function,
  typeForAttribute: (attribute: any, user: any) => any,
  nullIfMissing: boolean,
  pluralizeType: boolean,
  ignoreRelationshipData: boolean,
  relationshipLinks: Links,
  relationshipMeta: RelationshipMeta,
  dataLinks: Links,
  included: boolean,
  includedLinks: Links,
  embed?: boolean,
  meta: any
}

export type caseOptions = 'dash-case' | 'lisp-case' | 'spinal-case' | 'kebab-case' | 'underscore_case' | 'snake_case' | 'camelCase' | 'CamelCase';

export interface RelationshipMeta {
  [key: string]: number | RelationshipMetaFunction
}

export interface Links {
  [key: string]: string | LinkFunction
}

export declare type LinkFunction = (links: any, current?: any, parent?: any) => string;

export declare interface AttributesObject {
  [key: string]: string
};
export declare type RelationshipMetaFunction = (record: any) => string;

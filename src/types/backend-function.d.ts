type Dependency = {
  attributes: string[];
  category: string;
  resourceName: string;
};

export type ConfigItem = {
  build: boolean;
  dependsOn: Dependency[];
  providerPlugin: string;
  service: string;
};

export type Functions = Record<string, ConfigItem>;

export type ParameterItem = {
  Type: string;
  Default?: string;
  Description?: string;
};

export type Parameters = Record<string, ParameterItem>;

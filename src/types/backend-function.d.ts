type Dependency = {
  attributes: string[];
  category: string;
  resourceName: string;
};

type ConfigItem = {
  build: boolean;
  dependsOn: Dependency[];
  providerPlugin: string;
  service: string;
};

export type Functions = Record<string, ConfigItem>;

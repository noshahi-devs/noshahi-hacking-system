import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { config } from './app/app.config.server';

const bootstrap = (context: any) => {
  const serverConfig: ApplicationConfig = {
    providers: []
  };
  return bootstrapApplication(App, mergeApplicationConfig(config, serverConfig));
};

export default bootstrap;

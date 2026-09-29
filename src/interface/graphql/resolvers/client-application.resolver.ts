import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import { useCases } from '../../../container/index.js';
import { toConnection } from '../pagination.js';

async function reloadClientApplication(id: string) {
  const clientApplication = await useCases.clientApplication.getClientApplication.execute({
    clientApplicationId: id,
  });
  if (!clientApplication) throw new ClientApplicationNotFoundError(id);
  return clientApplication;
}

export const clientApplicationResolvers = {
  Query: {
    clientApplication: (_: unknown, args: { id: string }) =>
      useCases.clientApplication.getClientApplication.execute({ clientApplicationId: args.id }),

    clientApplications: async (_: unknown, args: { page: number; limit: number }) =>
      toConnection(await useCases.clientApplication.listClientApplications.execute(args)),
  },

  Mutation: {
    createClientApplication: (_: unknown, args: { name: string; redirectUris: string[] }) =>
      useCases.clientApplication.createClientApplication.execute(args),

    updateClientApplication: (_: unknown, args: { id: string; name: string }) =>
      useCases.clientApplication.updateClientApplication.execute({
        clientApplicationId: args.id,
        name: args.name,
      }),

    rotateClientSecret: (_: unknown, args: { id: string }) =>
      useCases.clientApplication.rotateClientSecret.execute({ clientApplicationId: args.id }),

    addRedirectUri: (_: unknown, args: { id: string; uri: string }) =>
      useCases.clientApplication.addRedirectUri.execute({
        clientApplicationId: args.id,
        redirectUri: args.uri,
      }),

    removeRedirectUri: (_: unknown, args: { id: string; uri: string }) =>
      useCases.clientApplication.removeRedirectUri.execute({
        clientApplicationId: args.id,
        redirectUri: args.uri,
      }),

    activateClientApplication: async (_: unknown, args: { id: string }) => {
      await useCases.clientApplication.activateClientApplication.execute({
        clientApplicationId: args.id,
      });
      return reloadClientApplication(args.id);
    },

    deactivateClientApplication: async (_: unknown, args: { id: string }) => {
      await useCases.clientApplication.deactivateClientApplication.execute({
        clientApplicationId: args.id,
      });
      return reloadClientApplication(args.id);
    },

    deleteClientApplication: async (_: unknown, args: { id: string }): Promise<boolean> => {
      await useCases.clientApplication.deleteClientApplication.execute({
        clientApplicationId: args.id,
      });
      return true;
    },
  },
};

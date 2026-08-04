import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { functions } from "./app";

export const functionsService = {
  call: async <TReq, TRes>(
    functionName: string,
    data?: TReq
  ): Promise<HttpsCallableResult<TRes>> => {
    const fnRef = httpsCallable<TReq, TRes>(functions, functionName);
    return fnRef(data);
  }
};

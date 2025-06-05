import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { backendID } from "../../app/config/templateVars";
import { ISubdivision } from "../../shared/types/subdivision/subdivision";

interface ResponseType {
  data: ISubdivision[]
}

// Пример API для получения подразделений
export const tempApi = createApi({
  reducerPath: "temp",
  baseQuery: fetchBaseQuery({
    // baseUrl: "http://localhost/custom_web_template.html",
    baseUrl: "/custom_web_template.html",
  }),
  endpoints: (builder) => ({
    getSubdivisions: builder.query({
      query: () => {
        const formData = new FormData();
        formData.append("method", "getSubdivisions");
        return {
          url: "",
          method: "POST",
          params: { object_code: backendID },
          body: formData,
        };
      },
      transformResponse: (response: ResponseType) => response.data,
    }),
  }),
});

export const {
  useGetSubdivisionsQuery,
} = tempApi;

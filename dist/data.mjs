export const DATASET_URL=new URL('./dataset.json?v=98d28821314e',import.meta.url);
export async function loadCollection(fetcher=fetch){
 const response=await fetcher(DATASET_URL);
 if(!response.ok)throw new Error('Collection load failed.');
 return response.json();
}

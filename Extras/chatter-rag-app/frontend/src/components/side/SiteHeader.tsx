
import SideBar from '@/components/side/SideBar';
import { CheckLanguageModel, CheckEmbeddingsModel } from '@/server/Models';
import { GetPromptCreativity, GetPromptTemplate } from "@/server/Prompts";
import { GenerateSources } from '@/server/Sources';

export default async function SiteHeader() {

  return (
    <header className="w-full border-b sticky top-0">
      <div className="flex h-14 items-center px-4">
        <SideBar 
          child0 = { <GenerateSources /> }
          child1 = { <CheckLanguageModel /> }
          child2= { <CheckEmbeddingsModel /> } 
          child3 =  { <GetPromptCreativity /> } 
          child4 =  { <GetPromptTemplate /> } />
      </div>
    </header>
  );
}
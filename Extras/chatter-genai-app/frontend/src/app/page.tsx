import MainContainer from "@/components/answers/MainContainer";
import SiteHeader from "@/components/side/SiteHeader";
import "./mystyles.css";


export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen">
      <SiteHeader />
      <MainContainer />
    </div>
  );
}

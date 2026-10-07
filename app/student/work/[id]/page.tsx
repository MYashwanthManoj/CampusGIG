import { ContractWorkspace } from "@/components/contract-workspace";
export default async function StudentWork({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContractWorkspace id={id} role="student" />;
}
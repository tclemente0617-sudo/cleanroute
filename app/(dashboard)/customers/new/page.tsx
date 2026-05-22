import { Card, PageHeader } from "@/components/ui";
import CustomerForm from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div>
      <PageHeader title="Add Customer" />
      <Card className="p-6">
        <CustomerForm />
      </Card>
    </div>
  );
}

import { VectorService, Document } from './vector-service';

export class DataIngestionService {
  constructor(private vectorService: VectorService) {}

  async ingestAllData(btcPayData: any): Promise<void> {
    console.log('Starting data ingestion...');
    
    // Clear existing data
    await this.vectorService.clearAll();
    
    // Ingest invoices if available
    if (btcPayData?.invoices) {
      await this.ingestInvoices(btcPayData.invoices);
    }
    
    const count = await this.vectorService.getDocumentCount();
    console.log(`Data ingestion complete. Indexed ${count} documents.`);
  }

  private async ingestInvoices(invoices: any[]): Promise<void> {
    try {
      const documents: Document[] = [];

      for (const invoice of invoices) {
        // Create a comprehensive text representation of the invoice
        const content = this.createInvoiceContent(invoice);
        
        const doc: Document = {
          id: `invoice-${invoice.id}`,
          content,
          metadata: {
            type: 'invoice',
            entityId: invoice.id,
            timestamp: invoice.createdTime,
            amount: parseFloat(invoice.amount || '0'),
            currency: invoice.currency,
            status: invoice.status,
            orderId: invoice.orderId,
            buyerEmail: invoice.metadata?.buyerEmail,
            itemDesc: invoice.metadata?.itemDesc,
          },
        };
        
        documents.push(doc);

        // Also index payment methods if available
        if (invoice.checkout?.paymentMethods) {
          for (const [method, details] of Object.entries(invoice.checkout.paymentMethods)) {
            const paymentDoc: Document = {
              id: `payment-method-${invoice.id}-${method}`,
              content: `Payment method ${method} for invoice ${invoice.id}: ${JSON.stringify(details)}`,
              metadata: {
                type: 'payment',
                entityId: `${invoice.id}-${method}`,
                invoiceId: invoice.id,
                method,
                ...details as any,
              },
            };
            documents.push(paymentDoc);
          }
        }
      }

      await this.vectorService.addDocuments(documents);
      console.log(`Indexed ${documents.length} invoice-related documents`);
    } catch (error) {
      console.error('Failed to ingest invoices:', error);
      throw error;
    }
  }

  private createInvoiceContent(invoice: any): string {
    const parts = [
      `Invoice ID: ${invoice.id}`,
      `Amount: ${invoice.amount} ${invoice.currency}`,
      `Status: ${invoice.status}`,
      `Created: ${new Date(invoice.createdTime * 1000).toLocaleString()}`,
    ];

    if (invoice.orderId) {
      parts.push(`Order ID: ${invoice.orderId}`);
    }

    if (invoice.metadata?.buyerEmail) {
      parts.push(`Customer Email: ${invoice.metadata.buyerEmail}`);
    }

    if (invoice.metadata?.buyerName) {
      parts.push(`Customer Name: ${invoice.metadata.buyerName}`);
    }

    if (invoice.metadata?.itemDesc) {
      parts.push(`Description: ${invoice.metadata.itemDesc}`);
    }

    if (invoice.checkout?.speedPolicy) {
      parts.push(`Speed Policy: ${invoice.checkout.speedPolicy}`);
    }

    if (invoice.additionalStatus) {
      parts.push(`Additional Status: ${invoice.additionalStatus}`);
    }

    // Add receipt information if available
    if (invoice.receiptData) {
      parts.push(`Receipt: ${JSON.stringify(invoice.receiptData)}`);
    }

    return parts.join('\n');
  }
}
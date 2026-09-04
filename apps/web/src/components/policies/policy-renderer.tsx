import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Info, AlertTriangle } from 'lucide-react';

interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'alert' | 'faq' | 'list';
  content?: string;
  question?: string;
  answer?: string;
  variant?: 'default' | 'destructive';
  items?: string[];
}

export function PolicyRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-muted-foreground text-center py-10">No content available.</p>;
  }

  // Group adjacent FAQs into a single accordion
  const renderedBlocks: React.ReactNode[] = [];
  let faqGroup: Block[] = [];

  const flushFaqs = () => {
    if (faqGroup.length > 0) {
      renderedBlocks.push(
        <Accordion key={`faq-group-${faqGroup[0]!.id}`} type="multiple" className="w-full my-6">
          {faqGroup.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
      faqGroup = [];
    }
  };

  blocks.forEach((block, index) => {
    if (block.type === 'faq') {
      faqGroup.push(block);
    } else {
      flushFaqs();
      
      switch (block.type) {
        case 'heading':
          renderedBlocks.push(
            <h2 key={block.id} className="text-2xl font-bold tracking-tight mt-8 mb-4">
              {block.content}
            </h2>
          );
          break;
        case 'paragraph':
          renderedBlocks.push(
            <p key={block.id} className="leading-7 [&:not(:first-child)]:mt-4 whitespace-pre-wrap">
              {block.content}
            </p>
          );
          break;
        case 'list':
          renderedBlocks.push(
            <ul key={block.id} className="my-6 ml-6 list-disc [&>li]:mt-2">
              {(block.items || []).filter(Boolean).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
          break;
        case 'alert':
          renderedBlocks.push(
            <Alert key={block.id} variant={block.variant || 'default'} className="my-6">
              {block.variant === 'destructive' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              <AlertTitle>{block.variant === 'destructive' ? 'Important' : 'Note'}</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">{block.content}</AlertDescription>
            </Alert>
          );
          break;
      }
    }
  });

  // Flush any remaining FAQs at the end
  flushFaqs();

  return <div className="policy-document">{renderedBlocks}</div>;
}

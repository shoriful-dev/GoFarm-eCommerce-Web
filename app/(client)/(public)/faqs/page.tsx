"use client";

import { motion } from "motion/react";
import { HelpCircle, MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Container from "@/components/Container";
import { faqsData } from "@/constants";
import Link from "next/link";

const FAQPage = () => {
  return (
    <div className="bg-linear-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-linear-to-r from-gofarm-green to-gofarm-light-green text-white">
        <Container className="max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <HelpCircle className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">FAQs</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-6">
              Quick answers to the most commonly asked questions about gofarm.
            </p>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              Essential Information
            </Badge>
          </motion.div>
        </Container>
      </section>

      {/* Main Content */}
      <Container className="py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center text-gofarm-green">
                Common Questions & Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion
                type="single"
                collapsible
                className="w-full space-y-4"
                defaultValue="item-0"
              >
                {faqsData.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <AccordionItem
                      value={`item-${index}`}
                      className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 px-6 py-2 hover:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="text-left text-lg font-semibold text-gofarm-green hover:text-gofarm-light-green transition-colors hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-dark-text leading-relaxed pt-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-linear-to-r from-gofarm-light-green to-gofarm-green text-white shadow-xl">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-4">Need More Help?</h3>
                <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                  Can&apos;t find the answer you&apos;re looking for? Check out
                  our comprehensive FAQ section or contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-gofarm-green hover:bg-white/90"
                  >
                    <Link href="/faq">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Detailed FAQ
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    <Link href="/contact">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
};

export default FAQPage;

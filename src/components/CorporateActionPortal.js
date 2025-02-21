import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function CorporateActionPortal() {
  const [eventID, setEventID] = useState("");
  const [issuer, setIssuer] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [dataHash, setDataHash] = useState("");
  const [submittedData, setSubmittedData] = useState([]);
  const [apiSubmission, setApiSubmission] = useState("");
  const [iso15022Message, setIso15022Message] = useState("");
  const [iso20022Message, setIso20022Message] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const typedArray = new Uint8Array(arrayBuffer);
        
        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;
        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map((item) => item.str).join(" ") + " ";
        }

        const parsedEventID = extractedText.match(/Event ID: (\S+)/)?.[1] || "EVT12345";
        const parsedIssuer = extractedText.match(/Issuer: (.+)/)?.[1] || "Issuer Corp";
        const parsedEventTitle = extractedText.match(/Event Title: (.+)/)?.[1] || "Stock Split";
        const parsedRecordDate = extractedText.match(/Record Date: (\S+)/)?.[1] || "2025-03-01";
        const parsedPaymentDate = extractedText.match(/Payment Date: (\S+)/)?.[1] || "2025-03-15";
        const parsedHash = btoa(extractedText).slice(0, 32);

        setEventID(parsedEventID);
        setIssuer(parsedIssuer);
        setEventTitle(parsedEventTitle);
        setRecordDate(parsedRecordDate);
        setPaymentDate(parsedPaymentDate);
        setDataHash(parsedHash);
      } catch (error) {
        console.error("Error parsing PDF:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleApiSubmit = () => {
    if (apiSubmission) {
      setSubmittedData([...submittedData, { eventID: "API", issuer: "API", eventTitle: apiSubmission, recordDate: "N/A", paymentDate: "N/A", dataHash: "N/A", status: "Pending Validation" }]);
      setApiSubmission("");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Corporate Action Validation Portal</h2>
      <Tabs>
        <TabsList>
          <TabsTrigger value="data-source">Data Source (Issuer, Exchange)</TabsTrigger>
          <TabsTrigger value="data-user">Data User (Custodian, Vendor)</TabsTrigger>
        </TabsList>

        <TabsContent value="data-source">
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Submit Corporate Action Document</h3>
              <input type="file" accept="application/pdf" onChange={handleFileUpload} className="mb-2" />
              <Input placeholder="Event ID" value={eventID} readOnly className="mb-2" />
              <Input placeholder="Issuer / Source" value={issuer} readOnly className="mb-2" />
              <Input placeholder="Event Title" value={eventTitle} readOnly className="mb-2" />
              <Input placeholder="Record Date" value={recordDate} readOnly className="mb-2" />
              <Input placeholder="Payment Date" value={paymentDate} readOnly className="mb-2" />
              <Input placeholder="Document Hash" value={dataHash} readOnly className="mb-2" />
              <Button onClick={() => setSubmittedData([...submittedData, { eventID, issuer, eventTitle, recordDate, paymentDate, dataHash, status: "Pending Validation" }])}>Submit</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-user">
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Submit Data via API or Message</h3>
              <Input placeholder="Enter API Data" value={apiSubmission} onChange={(e) => setApiSubmission(e.target.value)} className="mb-2" />
              <Button onClick={handleApiSubmit}>Submit via API</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

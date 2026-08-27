"use client"

import ReportForm from "@/src/components/report/reportContainer";
import { Navbar } from "@/src/components/layout/Navbar"

export default function ReportPage() {
    return (
        <>
            <Navbar activePage="lapor" />
            <ReportForm />
        </>
    );
}
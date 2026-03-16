'use client';

import React, { useState } from 'react';

function KeyRotationStatus() {
    const [rotating, setRotating] = useState(false);
    return (
        <div className="p-4 bg-gray-900 rounded-xl text-white border border-gray-800">
            <h3 className="text-xl mb-2 font-bold font-inter text-orange-400">API Key Rotation Schedule</h3>
            <p className="text-gray-400 text-sm mb-4">Keys automatically rotate every 90 days. Next rotation scheduled for <b>October 24, 2026</b>.</p>
            <button 
                onClick={() => { setRotating(true); setTimeout(() => setRotating(false), 2000); }}
                className={`px-4 py-2 font-bold rounded ${rotating ? 'bg-gray-600' : 'bg-orange-600 hover:bg-orange-700'}`}
                disabled={rotating}
            >
                {rotating ? 'Initiating HSM Key Rotation...' : 'Force Manual Key Rotation'}
            </button>
        </div>
    )
}

function SecretsVaultStatus() {
    return (
        <div className="p-4 bg-gray-900 rounded-xl text-white border border-gray-800">
            <h3 className="text-xl mb-2 font-bold font-inter text-emerald-400">Enterprise Secrets Vault Status</h3>
            <div className="flex bg-black mt-4 p-4 rounded items-center justify-between border border-gray-800">
                <div className="flex flex-col">
                    <span className="text-gray-400 font-mono text-xs mb-1">Vault Driver</span>
                    <span className="font-bold">Facttic KMS</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-gray-400 font-mono text-xs mb-1">State</span>
                    <span className="font-bold text-emerald-400">Encrypted (AES-256-CBC)</span>
                </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">All tenant API parameters are secured behind encrypted volumes avoiding arbitrary reads.</p>
        </div>
    );
}

function AccessAuditTable() {
    return (
        <div className="p-4 bg-gray-900 rounded-xl mt-4 text-white border border-gray-800 col-span-1 md:col-span-2 overflow-x-auto">
            <h3 className="text-xl mb-2 font-bold font-inter text-blue-400">Immutable Access Audit Trail</h3>
            <table className="w-full text-left border-collapse mt-2 text-sm">
                <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                        <th className="p-2">Event Timestamp</th>
                        <th className="p-2">Action Type</th>
                        <th className="p-2">Identity Source</th>
                        <th className="p-2 text-right">Integrity Digest</th>
                    </tr>
                </thead>
                <tbody className="font-mono text-xs text-gray-300">
                    <tr className="border-b border-gray-800/50 hover:bg-gray-800 transition">
                        <td className="p-2">2026-03-15 21:30:12</td>
                        <td className="p-2 text-orange-400">POLICY_OVERRIDE_ADMIN</td>
                        <td className="p-2">sys_admin_7291</td>
                        <td className="p-2 text-right">0x9A2F...1BA</td>
                    </tr>
                    <tr className="hover:bg-gray-800 transition">
                        <td className="p-2">2026-03-15 21:05:00</td>
                        <td className="p-2 text-blue-400">ROOT_LOGIN_SUCCESS</td>
                        <td className="p-2">idp_saml_auth</td>
                        <td className="p-2 text-right">0x7B1F...89C</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default function SecurityDashboardPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto h-screen bg-black overflow-y-auto">
            <h1 className="text-3xl text-white font-bold mb-6 font-inter border-b border-gray-800 pb-4">Enterprise Security Control Center</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SecretsVaultStatus />
                <KeyRotationStatus />
                <AccessAuditTable />
            </div>
        </div>
    );
}

'use client';

import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

interface WholesaleAccount {
  id: string;
  business_name: string;
  user_id: string;
  approval_status: string;
  tier: string;
  created_at: string;
}

export default function WholesalePage() {
  const [accounts, setAccounts] = useState<WholesaleAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<WholesaleAccount | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    tax_id: '',
    tier: 'standard',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('wholesale_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAccounts(data);
    }
    setLoading(false);
  };

  const handleApprove = async (accountId: string) => {
    const { error } = await supabase
      .from('wholesale_accounts')
      .update({ approval_status: 'approved' })
      .eq('id', accountId);

    if (!error) {
      fetchAccounts();
      setSelectedAccount(null);
    }
  };

  const handleReject = async (accountId: string) => {
    const { error } = await supabase
      .from('wholesale_accounts')
      .update({ approval_status: 'rejected' })
      .eq('id', accountId);

    if (!error) {
      fetchAccounts();
      setSelectedAccount(null);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Wholesale Accounts</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="card-title">Applications & Accounts</h2>

            {loading ? (
              <p>Loading...</p>
            ) : accounts.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Status</th>
                    <th>Tier</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr
                      key={account.id}
                      onClick={() => setSelectedAccount(account)}
                      style={{ cursor: 'pointer' }}
                      className={selectedAccount?.id === account.id ? 'bg-light' : ''}
                    >
                      <td className="font-medium">{account.business_name}</td>
                      <td>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            account.approval_status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : account.approval_status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {account.approval_status}
                        </span>
                      </td>
                      <td>{account.tier}</td>
                      <td className="text-sm">
                        {new Date(account.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No wholesale accounts yet</p>
            )}
          </div>
        </div>

        {selectedAccount && (
          <div className="card">
            <h2 className="card-title">Account Details</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Business Name</p>
                <p className="font-bold">{selectedAccount.business_name}</p>
              </div>

              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-bold">{selectedAccount.approval_status}</p>
              </div>

              <div>
                <p className="text-gray-600">Tier</p>
                <p className="font-bold">{selectedAccount.tier}</p>
              </div>

              <div>
                <p className="text-gray-600">Applied</p>
                <p className="text-xs">
                  {new Date(selectedAccount.created_at).toLocaleString()}
                </p>
              </div>

              {selectedAccount.approval_status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleApprove(selectedAccount.id)}
                    className="btn btn-primary flex-1"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedAccount.id)}
                    className="btn bg-red-600 text-white flex-1"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

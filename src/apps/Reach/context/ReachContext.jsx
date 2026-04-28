import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { leadsDb, getProspectsByTag } from '../../Leads/demoDb/leadsDb';
import { demoAuth, demoDb } from "../demo-services/cloud-provider";
import { onSnapshot, doc, getDoc, collection, query, getDocs } from "../demo-services/cloud-provider";

const MASTER_GAS_URL = "https://script.google.com/macros/s/AKfycbwmohKlv9c-MazRiF1Bq6w9gXhX3a9fjMTrl-JFi4kzNbJ9NfXRgarWm7dWw8SsPTz38A/exec"; // Replace with real Master GAS URL

const AVAILABLE_VARIABLES = ['business_name', 'category', 'location', 'remark'];

const parseSpintax = (text, leadData) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  });
  // Handle {{variable}}
  parsed = parsed.replace(/\{\{([^{}]+)\}\}/g, (match, variable) => {
    const key = variable.trim();
    return leadData[key] || match;
  });
  return parsed;
};

const ReachContext = createContext();

export const useReach = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  }
  return context;
};

export const ReachProvider = ({ children }) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  }, []);

  // ── Swarm Status Listener ──────────────────────────────────────────────────
  // Updated with robust error handling and collection-based query to prevent
  // Firestore internal assertion crashes (the "-1 counter bug").
  useEffect(() => {
    if (!currentUser || !currentUser.uid) return;

    let unsubscribe = null;
    
    try {
      const q = query(collection(demoDb, 'users', currentUser.uid, 'swarm_status'));
      
      unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const bots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSwarmBots(bots);
        },
        (error) => {
          console.warn("[ReachContext] Quietly ignoring listener drop:", error.message);
          setSwarmBots([]);
          // By NOT throwing the error, we prevent the Firestore internal assertion crash
        }
      );
    } catch (err) {
      console.error("Failed to attach listener:", err);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  // ── Manual refresh (getDocs one-shot) ──────────────────────────────────────────────
  const refreshSwarmBots = useCallback(async () => {
    if (!currentUser || isRefreshingSwarm) return;
    setIsRefreshingSwarm(true);
    try {
      const q = query(collection(demoDb, 'users', currentUser.uid, 'swarm_status'));
      const snap = await getDocs(q);
      
      const bots = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSwarmBots(bots);
      
      if (bots.length === 0) {
        console.warn(
          '[BizReach] No swarm nodes found in collection at:\n' +
          `  users/${currentUser.uid}/swarm_status\n` +
          'Ensure your GAS worker writes individual bot docs to this collection.'
        );
      }
    } catch (err) {
      console.error('[ReachContext] refreshSwarmBots error:', err);
    } finally {
      setIsRefreshingSwarm(false);
    }
  }, [currentUser, isRefreshingSwarm]);

  // --- Dexie Queries ---
  
  // Templates
  const templates = useLiveQuery(() => leadsDb.reach_templates.toArray(), []) || [];
  
  // Campaigns
  const campaigns = useLiveQuery(() => leadsDb.reach_campaigns.toArray(), []) || [];

  // Audience Data: Tags with contact counts
  const audienceTags = useLiveQuery(async () => {
    const allTags = await leadsDb.tags.toArray();
    
    // For each tag, we need to calculate how many prospects have emails/phones
    const tagsWithMetrics = await Promise.all(allTags.map(async (tag) => {
      const associations = await leadsDb.prospect_tags.where('tag_id').equals(tag.id).toArray();
      const prospectIds = associations.map(a => a.prospect_id);
      
      if (prospectIds.length === 0) {
        return { id: tag.id, name: tag.name, count: 0, emails: 0, phones: 0 };
      }

      const prospects = await leadsDb.prospects.where('id').anyOf(prospectIds).toArray();
      
      return {
        id: tag.id,
        name: tag.name,
        count: prospects.length,
        emails: prospects.filter(p => p.active_email).length,
        phones: prospects.filter(p => p.active_phone).length
      };
    }));

    return tagsWithMetrics;
  }, []) || [];

  // --- 2. Mutation Helpers ---

  const saveTemplate = async (template) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } else {
      // If it's a mock ID (string starting with t_) or null, add as new
      const cleanData = { ...data };
      delete cleanData.id; 
      return await leadsDb.reach_templates.add(cleanData);
    }
  };

  const deleteTemplate = async (id) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const saveCampaign = async (campaign) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } else {
      const cleanData = { ...data };
      delete cleanData.id;
      return await leadsDb.reach_campaigns.add(cleanData);
    }
  };

  const deleteCampaign = async (id) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const launchCampaign = async (campaignData) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      };

      if (emailTemplate) {
        entry.email_payload = {
          subject: parseSpintax(emailTemplate.subject, lead),
          sender_name: parseSpintax(emailTemplate.sender_name, lead),
          reply_to: emailTemplate.reply_to,
          body_text: parseSpintax(emailTemplate.content, lead),
          body_html: parseSpintax(emailTemplate.html_content, lead),
        };
      }

      if (smsTemplate) {
        entry.sms_payload = {
          content: parseSpintax(smsTemplate.content, lead),
        };
      }

      return entry;
    });

    // Update last_contacted to prevent double-outreach
    const prospectIds = prospects.map(p => p.id);
    await leadsDb.prospects.where('id').anyOf(prospectIds).modify({ last_contacted: now });

    // 4. Update campaign status and save payload
    const updateData = {
      ...campaignData,
      status: 'pending_handoff',
      payload,
      metrics: {
        total: payload.length,
        sent: 0,
        failed: 0,
        pending: payload.length
      },
      launched_at: Date.now()
    };

    delete updateData.id;

    if (id && typeof id === 'number') {
      await leadsDb.reach_campaigns.update(id, updateData);
      return id;
    } else {
      return await leadsDb.reach_campaigns.add(updateData);
    }
  };

  const handoffCampaign = async (campaignId) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        })
      });
      
      if (response.ok) {
        await leadsDb.reach_campaigns.update(Number(campaignId), { 
          status: 'running',
          handed_off_at: Date.now()
        });
        return true;
      }
    } catch (error) {
      console.error("GAS Handoff failed:", error);
    }
    return false;
  };

  const requestOnboardingEmail = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        })
      });
      return response.ok;
    } catch (e) {
      console.error("Onboarding email request failed:", e);
      return false;
    } finally {
      setIsEmailingSetup(false);
    }
  };

  const connectMobileApp = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const requestReport = async (campaignName) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        })
      });
    } catch (e) {
      console.error("Report request failed:", e);
    }
  };

  const value = useMemo(() => ({
    templates,
    campaigns,
    audienceTags,
    swarmBots,
    isEmailingSetup,
    smsAppConnected,
    isRefreshingSwarm,
    refreshSwarmBots,
    saveTemplate,
    deleteTemplate,
    saveCampaign,
    deleteCampaign,
    launchCampaign,
    handoffCampaign,
    requestReport,
    requestOnboardingEmail,
    connectMobileApp,
    parseSpintax,
    AVAILABLE_VARIABLES
  }), [templates, campaigns, audienceTags, swarmBots, isEmailingSetup, smsAppConnected, isRefreshingSwarm, refreshSwarmBots]);

  return (
    <ReachContext.Provider value={value}>
      {children}
    </ReachContext.Provider>
  );
};

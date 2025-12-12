'use client';

import { useEffect, useState } from 'react';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { LuTriangleAlert, LuShield } from 'react-icons/lu';

const AUDIT_WARNING_KEY = 'bze-audit-warning-acknowledged';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function SecurityAuditWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check if user has acknowledged the warning
    const acknowledgedTimestamp = localStorage.getItem(AUDIT_WARNING_KEY);

    if (!acknowledgedTimestamp) {
      // Never acknowledged, show warning after a short delay
      setTimeout(() => {
        setShowWarning(true);
      }, 2000);
    } else {
      // Check if 24 hours have passed since last acknowledgment
      const timeSinceAcknowledgment = Date.now() - parseInt(acknowledgedTimestamp);
      if (timeSinceAcknowledgment >= TWENTY_FOUR_HOURS) {
        setTimeout(() => {
          setShowWarning(true);
        }, 2000);
      }
    }
  }, []);

  const handleAcknowledge = () => {
    // Store current timestamp
    localStorage.setItem(AUDIT_WARNING_KEY, Date.now().toString());
    setShowWarning(false);
  };

  if (!showWarning) {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom={{ base: "4", md: "6" }}
      right={{ base: "4", md: "6" }}
      maxW={{ base: "calc(100vw - 32px)", md: "420px" }}
      zIndex="toast"
      bg="bg.panel"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="orange.500/40"
      shadow="lg"
      p="4"
      animation="slideIn 0.3s ease-out"
    >
      <VStack align="stretch" gap="4">
        <HStack gap="3" align="start">
          <Box color="orange.500" fontSize="xl" mt="0.5" flexShrink={0}>
            <LuShield />
          </Box>
          <VStack align="start" gap="2" flex="1">
            <HStack gap="2">
              <Text fontSize="md" fontWeight="bold" color="fg.emphasized">
                Security Audit
              </Text>
              <Box color="orange.500" fontSize="sm">
                <LuTriangleAlert />
              </Box>
            </HStack>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.6" fontWeight={"bold"}>
              While BeeZee Blockchain is built with security as a top priority and we have full confidence in our code, we&#39;re currently undergoing a professional security audit. Until that process is complete, please keep in mind that some risks may still exist. External audits by independent security experts are a critical step toward ensuring the network is truly bulletproof — and we’re fully committed to doing things the right way.
            </Text>
          </VStack>
        </HStack>

        <Button
          onClick={handleAcknowledge}
          colorPalette="orange"
          variant="solid"
          size="sm"
          w="full"
          fontWeight="semibold"
        >
          I Understand The Risks
        </Button>
      </VStack>
    </Box>
  );
}

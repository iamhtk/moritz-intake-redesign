'use client';

import React from 'react';
import {
  Alert,
  AlertAction,
  AlertCancel,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
} from '@/components/design/foundations/components/alert';
import { buttonVariants } from '@/components/design/foundations/components/button';

type DeleteItemType =
  | 'position'
  | 'positions'
  | 'project'
  | 'column'
  | 'prompt'
  | 'prompts'
  | 'question'
  | 'check';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: DeleteItemType;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
}: DeleteConfirmationModalProps) {
  const getItemTypeText = () => {
    switch (itemType) {
      case 'position':
        return 'position';
      case 'positions':
        return 'positions';
      case 'project':
        return 'project';
      case 'column':
        return 'column';
      case 'prompt':
        return 'prompt';
      case 'prompts':
        return 'prompts';
      case 'question':
        return 'question';
      case 'check':
        return 'check';
      default:
        return 'item';
    }
  };

  const getDeleteMessage = () => {
    switch (itemType) {
      case 'position':
        return 'This will permanently remove the position and all its associated data from the table.';
      case 'positions':
        return 'This will permanently remove the positions and all their associated data from the table.';
      case 'project':
        return 'This will permanently remove the project and all its associated data, including Documents and analysis results.';
      case 'column':
        return 'This will permanently remove the column and all its associated data from the table.';
      case 'prompt':
        return 'This will permanently remove the prompt from your library.';
      case 'prompts':
        return 'This will permanently remove the prompts from your library.';
      case 'question':
        return 'This action cannot be undone.';
      case 'check':
        return 'This action cannot be undone.';
      default:
        return 'This action cannot be undone.';
    }
  };

  const itemTypeText = getItemTypeText();

  return (
    <Alert
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertContent>
        <AlertHeader>
          <AlertTitle>Delete {itemTypeText}</AlertTitle>
          <AlertDescription>
            Are you sure you want to delete{' '}
            <span className="text-foreground font-medium">{itemName}</span>?{' '}
            {getDeleteMessage()}
          </AlertDescription>
        </AlertHeader>
        <AlertFooter>
          <AlertCancel>Cancel</AlertCancel>
          <AlertAction
            className={buttonVariants({ variant: 'destructive' })}
            onClick={onConfirm}
          >
            Delete {itemTypeText}
          </AlertAction>
        </AlertFooter>
      </AlertContent>
    </Alert>
  );
}

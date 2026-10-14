import { useMemo, useState, type ChangeEvent } from 'react';
import { Button } from '../../components/Button/Button.js';
import { FormField } from '../../components/FormField/FormField.js';
import { Modal } from '../../components/Modal/Modal.js';
import { TextInput } from '../../components/TextInput/TextInput.js';
import { Icon } from '../../components/Icon/Icon.js';
import { useDirectory } from '../../lib/directoryStore.js';
import { MoveGroupsModal } from '../GroupsPage/MoveGroupsModal.js';
import styles from './NewUserModal.module.css';

export interface NewUserModalProps {
  open: boolean;
  onClose: () => void;
  objectKind: 'entra' | 'ad';
  directories: string[];
  onCreate: (draft: {
    firstName: string;
    lastName: string;
    initials: string;
    name: string;
    displayName: string;
    userLogonName: string;
    directory: string;
    location: string;
    inactive: boolean;
  }) => void;
}

interface Draft {
  firstName: string;
  lastName: string;
  initials: string;
  name: string;
  displayName: string;
  userLogonName: string;
  directory: string;
  location: string;
  suffix: string;
  preWindowsLogonName: string;
}

const EMPTY_DRAFT: Draft = {
  firstName: '',
  lastName: '',
  initials: '',
  name: '',
  displayName: '',
  userLogonName: '',
  directory: 'Entra 1',
  location: '',
  suffix: '@Entra1',
  preWindowsLogonName: '',
};

export function NewUserModal({ open, onClose, objectKind, directories, onCreate }: NewUserModalProps) {
  const { getPath } = useDirectory();
  const [draft, setDraft] = useState<Draft>(() => ({ ...EMPTY_DRAFT, directory: directories[0] ?? 'Entra 1' }));
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const setField = (field: keyof Draft) => (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const canContinue = useMemo(() => {
    const baseValid = Boolean(
      draft.firstName.trim() &&
      draft.lastName.trim() &&
      draft.name.trim() &&
      draft.displayName.trim() &&
      draft.userLogonName.trim(),
    );
    if (objectKind !== 'ad') return baseValid;
    return baseValid && Boolean(draft.preWindowsLogonName.trim()) && Boolean(draft.location.trim());
  }, [draft, objectKind]);
  const close = () => {
    setDraft({ ...EMPTY_DRAFT, directory: directories[0] ?? 'Entra 1' });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={objectKind === 'ad' ? 'New AD User' : 'New Entra User'}
      subtitle={draft.directory}
      leadingIcon="User"
      size="l"
      className={styles.modal}
      bodyClassName={styles.body}
      footer={
        <div className={styles.footerContent}>
          <Button
            variant="primary"
            disabled={!canContinue}
            onClick={() => {
              onCreate({
                firstName: draft.firstName.trim(),
                lastName: draft.lastName.trim(),
                initials: draft.initials.trim(),
                name: draft.name.trim(),
                displayName: draft.displayName.trim(),
                userLogonName: draft.userLogonName.trim(),
                directory: draft.directory,
                location: draft.location,
                inactive: false,
              });
              close();
            }}
          >
            Create object
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        <div className={styles.form}>
          <div className={styles.twoColumn}>
            <FormField label="First name" required>
              <TextInput value={draft.firstName} onChange={setField('firstName')} />
            </FormField>
            <FormField label="Last name" required>
              <TextInput value={draft.lastName} onChange={setField('lastName')} />
            </FormField>
          </div>
          <FormField label="Initials">
            <TextInput value={draft.initials} onChange={setField('initials')} />
          </FormField>
          <FormField label="Name" required helperText="The object name used in the directory.">
            <TextInput value={draft.name} onChange={setField('name')} />
          </FormField>
          <FormField label="Display name" required helperText="The name shown to other users.">
            <TextInput value={draft.displayName} onChange={setField('displayName')} />
          </FormField>
          <div className={styles.twoColumnLogon}>
            <FormField label="User logon name" required helperText="The sign-in name for this user.">
              <TextInput value={draft.userLogonName} onChange={setField('userLogonName')} />
            </FormField>
            <FormField label="Directory" required>
              <select className={styles.directorySelect} value={draft.directory} onChange={(e) => setDraft((current) => ({ ...current, directory: e.target.value }))} aria-label="Directory">
                {directories.map((directory) => <option key={directory} value={directory}>{directory}</option>)}
              </select>
            </FormField>
          </div>
          {objectKind === 'ad' && (
            <FormField label="Location" required helperText="The organizational unit this user will be created in.">
              <button type="button" className={styles.folderButton} onClick={() => setFolderPickerOpen(true)}>
                <Icon name="FolderOpen" size="16px" />
                <span>{draft.location || 'Select destination folder'}</span>
              </button>
            </FormField>
          )}
          {objectKind === 'ad' && (
            <FormField label="User logon name (pre-Windows 2000)" required helperText="The legacy sign-in name.">
              <TextInput value={draft.preWindowsLogonName} onChange={setField('preWindowsLogonName')} />
            </FormField>
          )}
        </div>
        <aside className={styles.help}>
          <h3>Add new object</h3>
          <p>To manage identity and display names, complete the required fields.</p>
        </aside>
      </div>
      {objectKind === 'ad' && (
        <MoveGroupsModal
          open={folderPickerOpen}
          count={1}
          objectLabel="User"
          title="Select destination folder"
          confirmLabel="Select"
          elevated
          onClose={() => setFolderPickerOpen(false)}
          onMove={(nodeId) => {
            const path = getPath(nodeId).map((crumb) => crumb.name).join(' / ');
            setDraft((current) => ({ ...current, location: path }));
            setFolderPickerOpen(false);
          }}
        />
      )}
    </Modal>
  );
}

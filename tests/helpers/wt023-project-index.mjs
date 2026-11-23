/* WT-023A: read-only project-folder index over the existing Studio v1 archive.
 * A savedProjects entry is a snapshot, not an independent filesystem folder.
 * This module does not migrate data, allocate IDs, open projects or write storage.
 * The active project's ID is the stable group identity; snapshotId identifies
 * one saved revision. Preserve all snapshots, even when titles/model names match.
 */
import {validateProject} from '../../studio-documents.js';

const validSnapshotId = id => typeof id === 'string' && id.length > 0 && id.length <= 160;

function modelInfo(model) {
 return {
  id:model.id,
  name:model.name,
  family:model.generator.typeId,
  revision:model.revision,
  ...(model.link ? {linkedSourceId:model.link.sourceId,linkedRevision:model.link.revision} : {})
 };
}

function projectInfo(project) {
 return {
  projectId:project.id,
  title:project.title,
  updatedAt:project.updatedAt ?? null,
  models:project.models.map(modelInfo)
 };
}

/** Derive display folders without modifying current/saved project documents.
 * The returned entries are plain metadata; opening a snapshot requires its
 * explicit snapshotId and a separate backup-first confirmation.
 *
 * Legacy snapshots without IDs must be validated/migrated by the recovery
 * pathway before they are used for interactive folder actions. The existing
 * ensureSnapshotIds() is mutating and is intentionally NOT called here.
 */
export function listProjectFolders(state) {
 if (!state || !Array.isArray(state.savedProjects))
  throw Error('Studio project index requires an active project and saved-project snapshots.');
 validateProject(state.project);
 const current=projectInfo(state.project),groups=new Map(),seenSnapshots=new Set();
 groups.set(current.projectId,{
  id:current.projectId,
  title:current.title,
  current:true,
  active:current,
  snapshots:[]
 });
 for (const saved of state.savedProjects) {
  validateProject(saved);
  if (!validSnapshotId(saved.snapshotId))
   throw Error('Saved project needs a stable snapshot ID before it can appear in project folders.');
  if (seenSnapshots.has(saved.snapshotId))
   throw Error('Duplicate saved-project snapshot ID; preserve both records before organising.');
  seenSnapshots.add(saved.snapshotId);
  const summary={snapshotId:saved.snapshotId,...projectInfo(saved)};
  if (!groups.has(saved.id))
   groups.set(saved.id,{id:saved.id,title:saved.title,current:false,active:null,snapshots:[]});
  const group=groups.get(saved.id);
  // The active project title remains authoritative for its current folder.
  // For a non-active project, the newest saved snapshot carries its title.
  if (!group.current)group.title=saved.title;
  group.snapshots.push(summary);
 }
 return [...groups.values()];
}

/** Label an open model tab without changing project or model identity. */
export function projectModelTabLabel(project,model) {
 if (typeof project?.title !== 'string' || !project.title.trim() ||
     typeof model?.name !== 'string' || !model.name.trim())
  throw Error('Project and model need names before showing a project-qualified tab.');
 return project.title + ' : ' + model.name;
}

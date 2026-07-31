import { getStoredAIAPIKey, SECTIONS } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import {
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  FileJson,
  Printer,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { AIAdjustDialog } from '../ai/AIAdjustDialog';
import { AISettingsDialog } from '../ai/AISettingsDialog';
import { CVImportPreviewDialog } from '../import/CVImportPreviewDialog';
import { CertificationsForm } from '../forms/CertificationsForm';
import { EducationForm } from '../forms/EducationForm';
import { ExperienceForm } from '../forms/ExperienceForm';
import { PersonalForm } from '../forms/PersonalForm';
import { ProjectsForm } from '../forms/ProjectsForm';
import { SkillsForm } from '../forms/SkillsForm';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface EditorSidebarProps {
  className?: string;
  jsonInputRef: React.RefObject<HTMLInputElement | null>;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  handleImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImportPDF: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportData: () => void;
  handlePrintClick: () => void;
  cvData: CVData;
  onApplyCVData: (data: CVData) => void;
  pendingImport: CVData | null;
  onDiscardImport: () => void;
  aiSettingsOpen: boolean;
  onAISettingsOpenChange: (open: boolean) => void;
}

export function EditorSidebar({
  className,
  jsonInputRef,
  pdfInputRef,
  handleImportJSON,
  handleImportPDF,
  handleExportData,
  handlePrintClick,
  cvData,
  onApplyCVData,
  pendingImport,
  onDiscardImport,
  aiSettingsOpen,
  onAISettingsOpenChange,
}: EditorSidebarProps) {
  const { activeTab, setActiveTab } = useUIStore();
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  const handleImportPDFClick = () => {
    if (!getStoredAIAPIKey()) {
      onAISettingsOpenChange(true);
      return;
    }
    pdfInputRef.current?.click();
  };

  return (
    <section
      className={cn(
        'w-full lg:w-[35%] xl:w-[30%] flex-col border border-border bg-card rounded-xl shadow-lg overflow-hidden shrink-0 print:hidden',
        className,
      )}
    >
      <header className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30 z-10">
        <h1 className="text-lg font-bold tracking-tight">Curricula</h1>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 lg:h-8 text-xs font-semibold gap-2 bg-background"
                  onClick={() => setIsAIDialogOpen(true)}
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  AI Adjust
                </Button>
              }
            />
            <TooltipContent>
              <p>Rewrite your CV to match a job description</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 lg:h-8 text-xs font-semibold gap-2 bg-background"
                >
                  {activeTab}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 p-1.5">
              {SECTIONS.map(({ name, icon: Icon }) => (
                <DropdownMenuItem
                  key={name}
                  onClick={() => setActiveTab(name)}
                  className="gap-3 py-2.5 px-3 text-sm cursor-pointer rounded-md"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className={activeTab === name ? 'font-bold' : ''}>{name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full p-2">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6 pb-6">
            {activeTab === 'Personal' && <PersonalForm />}
            {activeTab === 'Experience' && <ExperienceForm />}
            {activeTab === 'Projects' && <ProjectsForm />}
            {activeTab === 'Education' && <EducationForm />}
            {activeTab === 'Skills' && <SkillsForm />}
            {activeTab === 'Certifications' && <CertificationsForm />}
          </form>
        </ScrollArea>
      </div>

      <footer className="px-5 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Saved
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json,application/json"
            ref={jsonInputRef}
            onChange={handleImportJSON}
            aria-label="Import CV data (JSON file)"
            className="hidden"
          />
          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={pdfInputRef}
            onChange={handleImportPDF}
            aria-label="Import CV data (PDF file)"
            className="hidden"
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 lg:h-8 text-xs font-semibold gap-2 bg-background"
                  aria-label="File actions"
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  File
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 p-1.5">
              <DropdownMenuItem
                onClick={() => jsonInputRef.current?.click()}
                className="gap-3 py-2.5 px-3 text-sm cursor-pointer rounded-md"
              >
                <FileJson className="w-4 h-4 text-muted-foreground" />
                Import JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleImportPDFClick}
                className="gap-3 py-2.5 px-3 text-sm cursor-pointer rounded-md"
              >
                <Upload className="w-4 h-4 text-muted-foreground" />
                Import PDF (AI)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportData}
                className="gap-3 py-2.5 px-3 text-sm cursor-pointer rounded-md"
              >
                <Download className="w-4 h-4 text-muted-foreground" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePrintClick}
                className="gap-3 py-2.5 px-3 text-sm cursor-pointer rounded-md"
              >
                <Printer className="w-4 h-4 text-muted-foreground" />
                Print / PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </footer>

      <AIAdjustDialog
        open={isAIDialogOpen}
        onOpenChange={setIsAIDialogOpen}
        cvData={cvData}
        onApply={onApplyCVData}
      />

      <AISettingsDialog open={aiSettingsOpen} onOpenChange={onAISettingsOpenChange} />

      <CVImportPreviewDialog
        cvData={pendingImport}
        onApply={() => {
          if (pendingImport) {
            onApplyCVData(pendingImport);
            onDiscardImport();
          }
        }}
        onDiscard={onDiscardImport}
      />
    </section>
  );
}

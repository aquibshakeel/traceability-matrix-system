/**
 * Orphan Test Categorizer
 * Automatically categorizes orphan tests as technical or business tests
 * Provides actionable recommendations for QA team
 */

import { UnitTest, OrphanTestCategory, OrphanTestAnalysis, OrphanCategorization } from '../types';

export class OrphanTestCategorizer {
  // Technical test patterns (POJO, DTO, Mapper, Exception, etc.)
  private readonly technicalPatterns = {
    entity: /Test\.(builder|settersAnd|setters?|getters?|equals|hashCode|toString|constructor|allArgs)/i,
    dto: /(Request|Response|Dto|Model)Test\./i,
    mapper: /MapperTest\.(toEntity|toResponse|to[A-Z]|updateEntity|map|Handle.*Null)/i,
    exception: /ExceptionTest\./i,
    errorHandler: /(ExceptionHandler|ErrorHandler|GlobalExceptionHandler)Test\./i,
    errorResponse: /Test\.errorResponse|error_response|ErrorResponse/i,
    validation: /Test\.(validation|Validation).*?(Fail|Pass|Invalid|Valid|Blank|Null|Empty|Short|Long|Young|Old|ShouldFail|ShouldPass)/i,
    infrastructure: /Test\.(setup|teardown|before|after|init|cleanup)/i,
  };

  // Business test patterns (Controller, Service operations)
  private readonly businessPatterns = {
    controller: /ControllerTest\.(get|post|put|patch|delete|create|update|remove)/i,
    service: /Service.*?Test\.(get|create|update|delete|find|search|list|filter)/i,
    api: /(get|post|put|delete|create|update|remove|fetch).*?(customer|user|order|product|profile)/i,
  };

  /**
   * Categorize all orphan tests
   */
  categorizeOrphanTests(orphanTests: UnitTest[]): OrphanTestAnalysis {
    const technicalTests: UnitTest[] = [];
    const businessTests: UnitTest[] = [];

    // Categorize each orphan test
    for (const test of orphanTests) {
      const category = this.categorizeTest(test);
      test.orphanCategory = category;
      
      if (category.type === 'technical') {
        technicalTests.push(test);
      } else {
        businessTests.push(test);
      }
    }

    // Group by subcategory
    const categorization = this.groupBySubtype(orphanTests);

    return {
      totalOrphans: orphanTests.length,
      technicalTests,
      businessTests,
      technicalCount: technicalTests.length,
      businessCount: businessTests.length,
      actionRequiredCount: businessTests.filter(t => 
        t.orphanCategory?.actionRequired === 'qa_add_scenario'
      ).length,
      categorization
    };
  }

  /**
   * Categorize a single test
   */
  private categorizeTest(test: UnitTest): OrphanTestCategory {
    const testId = test.id;
    const suite = test.suite || '';
    const description = test.description || '';

    // Check if it's a technical test
    const technicalCategory = this.checkTechnicalPatterns(testId, suite, description);
    if (technicalCategory) {
      return technicalCategory;
    }

    // Check if it's a business test
    const businessCategory = this.checkBusinessPatterns(testId, suite, description);
    if (businessCategory) {
      return businessCategory;
    }

    // Default: mark as business test requiring review
    return {
      type: 'business',
      subtype: 'Unknown Business Logic',
      priority: 'P2',
      actionRequired: 'review',
      reason: 'Could not automatically categorize - requires manual review',
    };
  }

  /**
   * Check against technical test patterns
   */
  private checkTechnicalPatterns(
    testId: string, 
    suite: string, 
    description: string
  ): OrphanTestCategory | null {
    const fullText = `${testId} ${suite} ${description}`;

    // Entity/Model tests (Builder, Getters/Setters, etc.)
    if (this.technicalPatterns.entity.test(fullText)) {
      return {
        type: 'technical',
        subtype: 'Entity/Model Test',
        priority: 'P3',
        actionRequired: 'none',
        reason: 'POJO/Entity infrastructure test - no scenario needed',
      };
    }

    // DTO tests
    if (this.technicalPatterns.dto.test(fullText)) {
      return {
        type: 'technical',
        subtype: 'DTO Test',
        priority: 'P3',
        actionRequired: 'none',
        reason: 'Data Transfer Object test - technical infrastructure',
      };
    }

    // Mapper tests
    if (this.technicalPatterns.mapper.test(fullText)) {
      return {
        type: 'technical',
        subtype: 'Mapper Test',
        priority: 'P3',
        actionRequired: 'none',
        reason: 'Data mapping/transformation logic - technical layer',
      };
    }

    // Exception tests
    if (this.technicalPatterns.exception.test(fullText)) {
      return {
        type: 'technical',
        subtype: 'Exception Test',
        priority: 'P3',
        actionRequired: 'none',
        reason: 'Custom exception testing - technical infrastructure',
      };
    }

    // Error handler tests
    if (this.technicalPatterns.errorHandler.test(fullText)) {
      return {
        type: 'technical',
        subtype: 'Error Handler Test',
        priority: 'P3',
        actionRequired: 'none',
        reason: 'Global exception handling - business errors covered in scenarios',
      };
    }

    // Error response tests
    if (this.technicalPatterns.errorResponse.test(fullText)) {
      return {
        type: 'technical',
        subtype: 'Error Response Test',
        priority: 'P3',
        actionRequired: 'none',
        reason: 'Error response DTO testing - technical infrastructure',
      };
    }

    // Validation tests
    if (this.technicalPatterns.validation.test(fullText)) {
      return {
        type: 'technical',
        subtype: 'Validation Test',
        priority: 'P3',
        actionRequired: 'none',
        reason: 'DTO/Request validation rules - technical constraints',
      };
    }

    return null;
  }

  /**
   * Check against business test patterns
   */
  private checkBusinessPatterns(
    testId: string,
    suite: string,
    description: string
  ): OrphanTestCategory | null {
    const fullText = `${testId} ${suite} ${description}`;

    // Controller tests
    if (this.businessPatterns.controller.test(fullText)) {
      const suggestedId = this.generateScenarioId(testId, suite);
      return {
        type: 'business',
        subtype: 'Controller/API Test',
        priority: 'P0',
        actionRequired: 'qa_add_scenario',
        reason: 'API endpoint test without matching scenario',
        suggestedScenarioId: suggestedId,
      };
    }

    // Service layer tests
    if (this.businessPatterns.service.test(fullText)) {
      // Check if it's a duplicate of controller test
      if (suite.includes('ServiceImpl') || suite.includes('Service')) {
        return {
          type: 'business',
          subtype: 'Service Layer Test',
          priority: 'P2',
          actionRequired: 'review',
          reason: 'Service layer test - may duplicate controller scenario',
        };
      }
    }

    // Generic business logic
    if (this.businessPatterns.api.test(fullText)) {
      return {
        type: 'business',
        subtype: 'Business Logic Test',
        priority: 'P1',
        actionRequired: 'qa_add_scenario',
        reason: 'Business functionality test without scenario',
      };
    }

    return null;
  }

  /**
   * Generate suggested scenario ID from test
   */
  private generateScenarioId(testId: string, suite: string): string {
    // Extract entity name from suite (e.g., CustomerControllerTest -> CUST)
    const match = suite.match(/^([A-Z][a-z]+)/);
    if (match) {
      const prefix = match[1].substring(0, 4).toUpperCase();
      return `${prefix}-XXX`;
    }
    return 'SCEN-XXX';
  }

  /**
   * Group tests by subtype for reporting
   */
  private groupBySubtype(tests: UnitTest[]): OrphanCategorization[] {
    const groups = new Map<string, UnitTest[]>();

    for (const test of tests) {
      const subtype = test.orphanCategory?.subtype || 'Uncategorized';
      if (!groups.has(subtype)) {
        groups.set(subtype, []);
      }
      groups.get(subtype)!.push(test);
    }

    const result: OrphanCategorization[] = [];
    for (const [category, testList] of groups.entries()) {
      const actionRequired = testList.some(t => 
        t.orphanCategory?.actionRequired === 'qa_add_scenario'
      );
      
      result.push({
        category,
        count: testList.length,
        tests: testList,
        actionRequired,
      });
    }

    // Sort by action required first (business tests on top), then by count
    result.sort((a, b) => {
      if (a.actionRequired !== b.actionRequired) {
        return a.actionRequired ? -1 : 1;
      }
      return b.count - a.count;
    });

    return result;
  }

  /**
   * Generate recommendations for QA team
   */
  generateRecommendations(analysis: OrphanTestAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.actionRequiredCount > 0) {
      recommendations.push(
        `⚠️ QA Action Required: ${analysis.actionRequiredCount} business test(s) need scenarios`
      );
    }

    if (analysis.technicalCount > 0) {
      recommendations.push(
        `✅ ${analysis.technicalCount} technical test(s) appropriately orphaned (no action needed)`
      );
    }

    if (analysis.businessCount > analysis.actionRequiredCount) {
      const reviewCount = analysis.businessCount - analysis.actionRequiredCount;
      recommendations.push(
        `📋 ${reviewCount} business test(s) require manual review (may be service layer duplicates)`
      );
    }

    return recommendations;
  }
}
